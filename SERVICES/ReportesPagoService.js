const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const notificacionesService = require('./NotificacionesService');
const EmailService = require('./EmailService');
const cloudinaryService = require('./CloudinaryService');

const reportesPagoService = {
    /**
     * Obtener la comisión acumulada del mes actual para un conductor
     */
    async obtenerComisionAcumulada(idUsuario) {
        const ahora = new Date();
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

        // Buscar todos los viajes completados del conductor en el mes
        const reservasCompletadas = await prisma.usuarioViaje.findMany({
            where: {
                estado: 'COMPLETADO',
                creadoEn: { gte: inicioMes, lte: finMes },
                viaje: {
                    vehiculo: {
                        idUsuario: idUsuario
                    }
                }
            },
            select: {
                precioFinal: true,
                comisionPlataforma: true
            }
        });

        const totalComision = reservasCompletadas.reduce((acc, r) => {
            // Si ya tiene comisionPlataforma calculada, usarla
            if (r.comisionPlataforma) return acc + Number(r.comisionPlataforma);
            // Si no, calcular 10% del precioFinal
            return acc + (Number(r.precioFinal || 0) * 0.10);
        }, 0);

        const totalIngresos = reservasCompletadas.reduce((acc, r) => acc + Number(r.precioFinal || 0), 0);

        // Verificar si ya tiene reporte del mes
        const reporteMes = await prisma.reportesPago.findFirst({
            where: {
                idUsuario,
                mesCorrespondiente: { gte: inicioMes, lte: finMes }
            },
            orderBy: { fechaEnvio: 'desc' }
        });

        return {
            mesActual: `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`,
            totalIngresos: Number(totalIngresos.toFixed(2)),
            totalComision: Number(totalComision.toFixed(2)),
            viajesCompletados: reservasCompletadas.length,
            reporteEnviado: !!reporteMes,
            estadoReporte: reporteMes?.estado || null
        };
    },

    /**
     * Conductor envía reporte de pago con foto del comprobante
     */
    async crearReporte(idUsuario, data) {
        const { fotoComprobante } = data;

        if (!fotoComprobante) {
            throw new Error('Debe adjuntar la foto del comprobante de pago.');
        }

        // Obtener comisión acumulada
        const comisionInfo = await this.obtenerComisionAcumulada(idUsuario);

        if (comisionInfo.totalComision <= 0) {
            throw new Error('No tiene comisión pendiente para este mes.');
        }

        // Verificar que no haya un reporte pendiente o aprobado del mes
        const ahora = new Date();
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

        const reporteExistente = await prisma.reportesPago.findFirst({
            where: {
                idUsuario,
                mesCorrespondiente: { gte: inicioMes, lte: finMes },
                estado: { in: ['PENDIENTE', 'APROBADO'] }
            }
        });

        if (reporteExistente) {
            throw new Error(
                reporteExistente.estado === 'APROBADO'
                    ? 'Ya tiene un reporte aprobado para este mes.'
                    : 'Ya tiene un reporte pendiente de revisión para este mes.'
            );
        }

        let fotoUrl;
        try {
            console.log('[ReportesPago] Subiendo comprobante a Cloudinary...');
            fotoUrl = await cloudinaryService.subirImagen(fotoComprobante, 'comprobantes_pago');
        } catch (error) {
            console.error('[ReportesPago] Error subiendo imagen:', error);
            throw new Error('Error al guardar la imagen. Intenta de nuevo.');
        }

        const reporte = await prisma.reportesPago.create({
            data: {
                idUsuario,
                mesCorrespondiente: inicioMes,
                montoComision: comisionInfo.totalComision,
                fotoComprobante: fotoUrl,
                estado: 'PENDIENTE'
            },
            include: {
                usuario: { select: { nombre: true, email: true } }
            }
        });

        // Notificar a TODOS los admins
        const admins = await prisma.usuarios.findMany({
            where: { rol: { nombre: 'ADMIN' } },
            select: { idUsuarios: true, email: true, nombre: true }
        });

        for (const admin of admins) {
            try {
                await notificacionesService.crearNotificacion({
                    idUsuario: admin.idUsuarios,
                    titulo: 'Nuevo Reporte de Pago',
                    mensaje: `${reporte.usuario.nombre} ha enviado un comprobante de pago por $${comisionInfo.totalComision.toLocaleString()} COP`,
                    tipo: 'PAGO'
                });
            } catch (e) {
                console.error('[ReportesPago] Error notificación admin:', e.message);
            }
        }

        return reporte;
    },

    /**
     * Listar reportes (Admin: todos, Conductor: propios)
     */
    async obtenerReportes(idUsuario, rol, filtros = {}) {
        const where = {};

        // Si es conductor, solo ve los suyos
        if (!rol.includes('ADMIN')) {
            where.idUsuario = idUsuario;
        }

        // Filtros opcionales
        if (filtros.estado) where.estado = filtros.estado;
        if (filtros.mes) {
            const [year, month] = filtros.mes.split('-');
            const inicio = new Date(parseInt(year), parseInt(month) - 1, 1);
            const fin = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
            where.mesCorrespondiente = { gte: inicio, lte: fin };
        }

        return await prisma.reportesPago.findMany({
            where,
            include: {
                usuario: {
                    select: { idUsuarios: true, nombre: true, email: true, fotoPerfil: true }
                }
            },
            orderBy: { fechaEnvio: 'desc' }
        });
    },

    /**
     * Admin aprueba un reporte
     */
    async aprobarReporte(idReporte) {
        const reporte = await prisma.reportesPago.findUnique({
            where: { idReporte: parseInt(idReporte) },
            include: { usuario: true }
        });

        if (!reporte) throw new Error('Reporte no encontrado');
        if (reporte.estado !== 'PENDIENTE') throw new Error('Solo se pueden aprobar reportes pendientes');

        const actualizado = await prisma.reportesPago.update({
            where: { idReporte: parseInt(idReporte) },
            data: {
                estado: 'APROBADO',
                fechaRevision: new Date()
            }
        });

        // Notificar al conductor
        try {
            await notificacionesService.crearNotificacion({
                idUsuario: reporte.idUsuario,
                titulo: 'Pago Aprobado',
                mensaje: `Tu comprobante de pago por $${Number(reporte.montoComision).toLocaleString()} COP ha sido aprobado. ¡Gracias!`,
                tipo: 'PAGO'
            });
        } catch (e) {
            console.error('[ReportesPago] Error notificación conductor:', e.message);
        }

        return actualizado;
    },

    /**
     * Admin rechaza un reporte
     */
    async rechazarReporte(idReporte, observaciones) {
        const reporte = await prisma.reportesPago.findUnique({
            where: { idReporte: parseInt(idReporte) },
            include: { usuario: true }
        });

        if (!reporte) throw new Error('Reporte no encontrado');
        if (reporte.estado !== 'PENDIENTE') throw new Error('Solo se pueden rechazar reportes pendientes');

        const actualizado = await prisma.reportesPago.update({
            where: { idReporte: parseInt(idReporte) },
            data: {
                estado: 'RECHAZADO',
                fechaRevision: new Date(),
                observaciones: observaciones || 'Reporte rechazado por el administrador'
            }
        });

        // Notificar al conductor
        try {
            await notificacionesService.crearNotificacion({
                idUsuario: reporte.idUsuario,
                titulo: 'Pago Rechazado',
                mensaje: `Tu comprobante de pago fue rechazado. Motivo: ${observaciones || 'No especificado'}. Envía un nuevo comprobante.`,
                tipo: 'PAGO'
            });
        } catch (e) {
            console.error('[ReportesPago] Error notificación conductor:', e.message);
        }

        return actualizado;
    },

    /**
     * Verificar pagos mensuales - Suspender conductores sin pago aprobado
     * Se puede llamar manualmente o con un cron job
     */
    async verificarPagosMensuales() {
        const ahora = new Date();
        // Verificar el mes anterior
        const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
        const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59);

        // Obtener todos los conductores activos
        const conductores = await prisma.usuarios.findMany({
            where: {
                rol: { nombre: 'CONDUCTOR' },
                estado: 'ACTIVO'
            },
            select: { idUsuarios: true, nombre: true }
        });

        const suspendidos = [];

        for (const conductor of conductores) {
            // Verificar si tiene viajes completados en el mes anterior
            const viajesCount = await prisma.usuarioViaje.count({
                where: {
                    estado: 'COMPLETADO',
                    creadoEn: { gte: mesAnterior, lte: finMesAnterior },
                    viaje: {
                        vehiculo: { idUsuario: conductor.idUsuarios }
                    }
                }
            });

            // Si no tuvo viajes, no necesita pagar
            if (viajesCount === 0) continue;

            // Verificar si tiene un reporte aprobado del mes anterior
            const reporteAprobado = await prisma.reportesPago.findFirst({
                where: {
                    idUsuario: conductor.idUsuarios,
                    mesCorrespondiente: { gte: mesAnterior, lte: finMesAnterior },
                    estado: 'APROBADO'
                }
            });

            // Si no tiene reporte aprobado, suspender
            if (!reporteAprobado) {
                await prisma.usuarios.update({
                    where: { idUsuarios: conductor.idUsuarios },
                    data: { estado: 'SUSPENDIDO' }
                });

                suspendidos.push(conductor);

                // Notificar
                try {
                    await notificacionesService.crearNotificacion({
                        idUsuario: conductor.idUsuarios,
                        titulo: 'Cuenta Suspendida',
                        mensaje: 'Tu cuenta ha sido suspendida por no enviar el comprobante de pago del mes anterior. Contacta al administrador.',
                        tipo: 'SISTEMA'
                    });
                } catch (e) {
                    console.error('[ReportesPago] Error notificación suspensión:', e.message);
                }
            }
        }

        return {
            verificados: conductores.length,
            suspendidos: suspendidos.length,
            conductoresSuspendidos: suspendidos
        };
    },

    /**
     * Enviar recordatorios de pago a conductores que no han pagado
     * Se ejecuta 5 días antes de fin de mes (o cuando el admin lo solicite)
     */
    async enviarRecordatoriosPago() {
        const ahora = new Date();
        const ultimoDiaMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
        const diasRestantes = ultimoDiaMes.getDate() - ahora.getDate();

        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

        // Obtener conductores activos
        const conductores = await prisma.usuarios.findMany({
            where: {
                rol: { nombre: 'CONDUCTOR' },
                estado: 'ACTIVO'
            },
            select: { idUsuarios: true, nombre: true, email: true }
        });

        let notificados = 0;

        for (const conductor of conductores) {
            // Verificar si tiene viajes completados este mes
            const viajesCount = await prisma.usuarioViaje.count({
                where: {
                    estado: 'COMPLETADO',
                    creadoEn: { gte: inicioMes, lte: finMes },
                    viaje: {
                        vehiculo: { idUsuario: conductor.idUsuarios }
                    }
                }
            });

            if (viajesCount === 0) continue;

            // Verificar si ya tiene reporte aprobado o pendiente del mes
            const reporteExistente = await prisma.reportesPago.findFirst({
                where: {
                    idUsuario: conductor.idUsuarios,
                    mesCorrespondiente: { gte: inicioMes, lte: finMes },
                    estado: { in: ['PENDIENTE', 'APROBADO'] }
                }
            });

            // Si ya tiene reporte, no recordar
            if (reporteExistente) continue;

            // Calcular comisión
            const comisionInfo = await this.obtenerComisionAcumulada(conductor.idUsuarios);

            // Enviar notificación in-app
            try {
                await notificacionesService.crearNotificacion({
                    idUsuario: conductor.idUsuarios,
                    titulo: '⚠️ Recordatorio de Pago',
                    mensaje: `Te quedan ${diasRestantes} días para enviar tu comprobante de pago. Comisión pendiente: $${comisionInfo.totalComision.toLocaleString()} COP. Si no pagas, tu cuenta será suspendida.`,
                    tipo: 'PAGO'
                });
            } catch (e) {
                console.error('[ReportesPago] Error notificación recordatorio:', e.message);
            }

            // Enviar email
            try {
                await EmailService.enviarRecordatorioPago(
                    conductor.email,
                    conductor.nombre,
                    comisionInfo.totalComision,
                    diasRestantes
                );
            } catch (e) {
                console.error('[ReportesPago] Error email recordatorio:', e.message);
            }

            notificados++;
        }

        return {
            totalConductores: conductores.length,
            notificados,
            diasRestantes
        };
    }
};

module.exports = reportesPagoService;
