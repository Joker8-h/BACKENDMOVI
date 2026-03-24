const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const notificacionesService = require('./NotificacionesService');
const EmailService = require('./EmailService');
const cloudinaryService = require('./CloudinaryService');

const reportesPagoService = {
    /**
     * Obtener la comisión acumulada para un conductor
     * Calcula desde el último pago aprobado o desde la creación de la cuenta
     */
    async obtenerComisionAcumulada(idUsuarioRaw) {
        const idUsuario = parseInt(idUsuarioRaw);
        const ahora = new Date();
        
        // 1. Obtener datos del usuario (fecha de registro)
        const usuario = await prisma.usuarios.findUnique({
            where: { idUsuarios: idUsuario },
            select: { creadoEn: true, nombre: true }
        });

        if (!usuario) throw new Error('Usuario no encontrado');

        // 2. Buscar el último reporte APROBADO para saber desde cuándo contar
        const ultimoReporteAprobado = await prisma.reportesPago.findFirst({
            where: {
                idUsuario,
                estado: 'APROBADO'
            },
            orderBy: { fechaEnvio: 'desc' }
        });

        // La fecha de inicio es la fecha de envío del último pago aprobado, o el inicio de los tiempos si es el primer pago
        const fechaInicio = ultimoReporteAprobado ? ultimoReporteAprobado.fechaEnvio : new Date(0);

        // 3. Buscar todos los viajes completados desde la fecha de inicio
        const reservasCompletadas = await prisma.usuarioViaje.findMany({
            where: {
                estado: 'COMPLETADO',
                viaje: {
                    fechaHoraSalida: { gte: fechaInicio },
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
            if (r.comisionPlataforma) return acc + Number(r.comisionPlataforma);
            return acc + (Number(r.precioFinal || 0) * 0.10);
        }, 0);

        const totalIngresos = reservasCompletadas.reduce((acc, r) => acc + Number(r.precioFinal || 0), 0);

        console.log(`[ReportesPago] Usuario ${idUsuario}: ${reservasCompletadas.length} viajes encontrados desde ${fechaInicio.toISOString()}. Total Comision: ${totalComision}`);

        // 4. Calcular próximo día de cobro (Billing Day)
        // Se basa en el día del mes en que se registró
        const diaRegistro = usuario.creadoEn.getDate();
        let proximoCobro = new Date(ahora.getFullYear(), ahora.getMonth(), diaRegistro);
        
        // Si ya pasó el día de cobro este mes, el próximo es el mes que viene
        if (proximoCobro <= ahora) {
            proximoCobro = new Date(ahora.getFullYear(), ahora.getMonth() + 1, diaRegistro);
        }

        const diasRestantes = Math.ceil((proximoCobro - ahora) / (1000 * 60 * 60 * 24));

        // Verificar si hay algún reporte PENDIENTE actualmente
        const reportePendiente = await prisma.reportesPago.findFirst({
            where: {
                idUsuario,
                estado: 'PENDIENTE'
            },
            orderBy: { fechaEnvio: 'desc' }
        });

        return {
            fechaInicioCalculo: fechaInicio,
            totalIngresos: Number(totalIngresos.toFixed(2)),
            totalComision: Number(totalComision.toFixed(2)),
            viajesCompletados: reservasCompletadas.length,
            proximoCobro,
            diasRestantes,
            tieneReportePendiente: !!reportePendiente,
            estadoReporte: reportePendiente?.estado || (ultimoReporteAprobado ? 'APROBADO' : null)
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

        // Obtener comisión acumulada actual
        const comisionInfo = await this.obtenerComisionAcumulada(idUsuario);
        console.log(`[ReportesPago] Validando reporte para usuario ${idUsuario}. Comisión calculada: ${comisionInfo.totalComision}`);

        // Permitir el envío de reportes incluso si la comisión calculada es 0, 
        // según el requerimiento del usuario ("que enviar comprobante esté siempre disponible").
        // El administrador revisará la cantidad enviada vs el comprobante.
        

        // Ya no restringimos por mes calendario. 
        // Solo verificamos que no tenga un reporte idéntico pendiente (opcional, pero ayuda a evitar duplicados accidentales)
        const reportePendienteMismoMonto = await prisma.reportesPago.findFirst({
            where: {
                idUsuario,
                estado: 'PENDIENTE',
                montoComision: comisionInfo.totalComision
            }
        });

        if (reportePendienteMismoMonto) {
            throw new Error('Ya tienes un reporte pendiente con este mismo monto. Espera a que sea revisado.');
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
                mesCorrespondiente: comisionInfo.proximoCobro,
                montoComision: comisionInfo.totalComision,
                fotoComprobante: fotoUrl,
                cantidadEnviada: data.cantidad ? Number(Number(data.cantidad).toFixed(2)) : null,
                estado: 'PENDIENTE'
            },
            include: {
                usuario: { select: { nombre: true, email: true } }
            }
        });

        console.log(`[ReportesPago] Reporte creado exitosamente: ${reporte.idReporte}`);

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
                    mensaje: `${reporte.usuario.nombre} ha enviado un comprobante de pago por $${comisionInfo.totalComision.toLocaleString()} COP. Corresponde al ciclo de ${new Date(comisionInfo.fechaInicioCalculo).toLocaleDateString()} a ${new Date(comisionInfo.proximoCobro).toLocaleDateString()}.`,
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
     * Verificar pagos vencidos - Suspende conductores que pasaron su fecha de cobro sin pagar
     */
    async verificarPagosMensuales() {
        const ahora = new Date();
        
        // Obtener todos los conductores activos
        const conductores = await prisma.usuarios.findMany({
            where: {
                rol: { nombre: 'CONDUCTOR' },
                estado: 'ACTIVO'
            },
            select: { idUsuarios: true, nombre: true, email: true, creadoEn: true }
        });

        const suspendidos = [];

        for (const conductor of conductores) {
            // Calcular su fecha de vencimiento actual
            const infoCobro = await this.obtenerComisionAcumulada(conductor.idUsuarios);
            
            // La fecha de vencimiento es proximoCobro - 1 mes (o el día de registro si es el primer mes)
            // Pero simplifiquemos: si totalComision > 0 Y el día de hoy es mayor/igual al día de registro + un margen?
            // Mejor así: si diasRestantes es muy alto (acaba de pasar el ciclo) Y tiene deuda acumulada 
            // Y no tiene un reporte pendiente: SUSPENDER.
            
            // Lógica exacta: si hoy PASÓ su día de registro en este mes, y sigue teniendo deuda del ciclo anterior.
            const diaVencimiento = conductor.creadoEn.getDate();
            const hoyDia = ahora.getDate();
            
            if (hoyDia > diaVencimiento && infoCobro.totalComision > 100 && !infoCobro.tieneReportePendiente) {
                // Verificar si ya envió un reporte en los últimos días que esté aprobado
                const ultimoAprobadoReciente = await prisma.reportesPago.findFirst({
                    where: {
                        idUsuario: conductor.idUsuarios,
                        estado: 'APROBADO',
                        fechaRevision: { gte: new Date(ahora.getFullYear(), ahora.getMonth(), diaVencimiento) }
                    }
                });

                if (!ultimoAprobadoReciente) {
                    await prisma.usuarios.update({
                        where: { idUsuarios: conductor.idUsuarios },
                        data: { estado: 'SUSPENDIDO' }
                    });

                    suspendidos.push(conductor);

                    // Notificaciones
                    try {
                        await notificacionesService.crearNotificacion({
                            idUsuario: conductor.idUsuarios,
                            titulo: 'Cuenta Suspendida',
                            mensaje: 'Tu cuenta ha sido suspendida por falta de pago de comisiones vencidas. Por favor envía tu comprobante.',
                            tipo: 'SISTEMA'
                        });
                        await EmailService.enviarNotificacionDesactivacion(conductor.email, conductor.nombre);
                    } catch (e) {
                        console.error('[ReportesPago] Error notificaciones suspensión:', e.message);
                    }
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
     * Enviar recordatorios de pago basados en la fecha individual de cada conductor
     */
    async enviarRecordatoriosPago() {
        const ahora = new Date();
        
        const conductores = await prisma.usuarios.findMany({
            where: {
                rol: { nombre: 'CONDUCTOR' },
                estado: 'ACTIVO'
            },
            select: { idUsuarios: true, nombre: true, email: true, creadoEn: true }
        });

        let notificados = 0;

        for (const conductor of conductores) {
            const info = await this.obtenerComisionAcumulada(conductor.idUsuarios);

            // Solo notificar si tiene deuda y faltan exactamente 5 días (o menos si es urgente)
            if (info.totalComision > 0 && info.diasRestantes <= 5 && !info.tieneReportePendiente) {
                
                // Evitar notificar múltiples veces el mismo día (opcional)
                
                try {
                    await notificacionesService.crearNotificacion({
                        idUsuario: conductor.idUsuarios,
                        titulo: '⚠️ Recordatorio de Pago',
                        mensaje: `Te quedan ${info.diasRestantes} días para el cierre de tu ciclo de facturación. Comisión pendiente: $${info.totalComision.toLocaleString()} COP.`,
                        tipo: 'PAGO'
                    });

                    await EmailService.enviarRecordatorioPago(
                        conductor.email,
                        conductor.nombre,
                        info.totalComision,
                        info.diasRestantes
                    );
                    notificados++;
                } catch (e) {
                    console.error('[ReportesPago] Error recordatorio:', e.message);
                }
            }
        }

        return {
            totalConductores: conductores.length,
            notificados
        };
    }
};

module.exports = reportesPagoService;
