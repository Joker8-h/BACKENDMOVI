const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class EstadisticasService {
    /**
     * Obtener ganancias de un conductor por periodo (diario, mensual, anual)
     * Si idUsuario es 'GLOBAL' y el rol permite, obtiene de toda la plataforma
     */
    async obtenerGananciasConductor(idUsuario, periodo = 'mensual', isGlobal = false) {
        const ahora = new Date();
        let fechaInicio;

        if (periodo === 'diario') {
            fechaInicio = new Date(ahora.setHours(0, 0, 0, 0));
        } else if (periodo === 'mensual') {
            fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        } else if (periodo === 'anual') {
            fechaInicio = new Date(ahora.getFullYear(), 0, 1);
        }

        // Definir filtro
        let whereClause = {
            estado: 'COMPLETADO',
            creadoEn: { gte: fechaInicio }
        };

        if (!isGlobal) {
            whereClause.viaje = {
                vehiculo: {
                    idUsuario: idUsuario
                }
            };
        }

        // Obtener viajes completados
        const viajesConductor = await prisma.usuarioViaje.findMany({
            where: whereClause,
            select: {
                precioFinal: true,
                creadoEn: true
            }
        });

        const totalGanancias = viajesConductor.reduce((acc, curr) => acc + Number(curr.precioFinal || 0), 0);

        // Agrupar por subperiodo para las gráficas
        const historial = this.agruparDatosPorPeriodo(viajesConductor, periodo, 'precioFinal');

        return {
            total: totalGanancias,
            periodo,
            historial
        };
    }

    /**
     * Helper para agrupar datos (ganancias o gastos) por periodo
     */
    agruparDatosPorPeriodo(items, periodo, campoValor) {
        const grupos = {};

        items.forEach(item => {
            let key;
            const fecha = new Date(item.creadoEn || item.fechaPago || new Date());
            if (periodo === 'diario') {
                key = `${fecha.getHours()}:00`;
            } else if (periodo === 'mensual') {
                key = `Día ${fecha.getDate()}`;
            } else if (periodo === 'anual') {
                const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                key = meses[fecha.getMonth()];
            }

            grupos[key] = (grupos[key] || 0) + Number(item[campoValor] || 0);
        });

        return Object.entries(grupos).map(([name, value]) => ({
            name,
            value: Number(value.toFixed(2))
        }));
    }

    /**
     * Obtener gastos de un pasajero o ingresos globales por periodo
     */
    async obtenerGastosPasajero(idUsuario, periodo = 'mensual', isGlobal = false) {
        const ahora = new Date();
        let fechaInicio;

        if (periodo === 'diario') {
            fechaInicio = new Date(ahora.setHours(0, 0, 0, 0));
        } else if (periodo === 'mensual') {
            fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        } else if (periodo === 'anual') {
            fechaInicio = new Date(ahora.getFullYear(), 0, 1);
        }

        let whereClause = {
            estado: 'PAGADO',
            fechaPago: { gte: fechaInicio }
        };

        if (!isGlobal) {
            whereClause.idUsuario = idUsuario;
        }

        // Buscamos en la tabla Pagos
        const pagos = await prisma.pagos.findMany({
            where: whereClause,
            select: {
                monto: true,
                fechaPago: true
            }
        });

        const total = pagos.reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
        const historial = this.agruparDatosPorPeriodo(pagos, periodo, 'monto');

        return {
            total,
            periodo,
            historial
        };
    }

    /**
     * Obtener resumen de viajes realizados
     */
    async obtenerResumenViajes(idUsuario, rol, isGlobal = false) {
        if (isGlobal || rol.includes('ADMIN')) {
            const total = await prisma.viajes.count({
                where: { estado: 'FINALIZADO' }
            });
            return { total, rol: 'ADMIN' };
        }

        if (rol === 'CONDUCTOR' || rol === 'CONDUCTOR_ADMIN') {
            const total = await prisma.viajes.count({
                where: {
                    vehiculo: {
                        idUsuario: idUsuario
                    },
                    estado: 'FINALIZADO'
                }
            });
            return { total, rol: 'CONDUCTOR' };
        } else {
            const total = await prisma.usuarioViaje.count({
                where: {
                    idUsuarios: idUsuario,
                    estado: 'COMPLETADO'
                }
            });
            return { total, rol: 'PASAJERO' };
        }
    }

    /**
     * Obtener historial de viajes por periodo para gráficas de frecuencia
     */
    async obtenerHistorialViajes(idUsuario, rol, periodo = 'mensual', isGlobal = false) {
        const ahora = new Date();
        let fechaInicio;

        if (periodo === 'diario') {
            fechaInicio = new Date(ahora.setHours(0, 0, 0, 0));
        } else if (periodo === 'mensual') {
            fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        } else if (periodo === 'anual') {
            fechaInicio = new Date(ahora.getFullYear(), 0, 1);
        }

        let viajes;
        if (isGlobal || rol.includes('ADMIN')) {
            viajes = await prisma.viajes.findMany({
                where: {
                    estado: 'FINALIZADO',
                    creadoEn: { gte: fechaInicio }
                },
                select: { creadoEn: true }
            });
        } else if (rol === 'CONDUCTOR' || rol === 'CONDUCTOR_ADMIN') {
            viajes = await prisma.viajes.findMany({
                where: {
                    vehiculo: { idUsuario: idUsuario },
                    estado: 'FINALIZADO',
                    creadoEn: { gte: fechaInicio }
                },
                select: { creadoEn: true }
            });
        } else {
            viajes = await prisma.usuarioViaje.findMany({
                where: {
                    idUsuarios: idUsuario,
                    estado: 'COMPLETADO',
                    creadoEn: { gte: fechaInicio }
                },
                select: { creadoEn: true }
            });
        }

        const grupos = {};
        viajes.forEach(v => {
            let key;
            const fecha = new Date(v.creadoEn);
            if (periodo === 'diario') key = `${fecha.getHours()}:00`;
            else if (periodo === 'mensual') key = `Día ${fecha.getDate()}`;
            else if (periodo === 'anual') {
                const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                key = meses[fecha.getMonth()];
            }
            grupos[key] = (grupos[key] || 0) + 1;
        });

        const historial = Object.entries(grupos).map(([name, value]) => ({ name, value }));

        return {
            total: viajes.length,
            periodo,
            historial
        };
    }

    /**
     * Obtener mejores rutas (más frecuentes)
     */
    async obtenerMejoresRutas(idUsuario, limit = 5, isGlobal = false) {
        let whereClause = { estado: 'FINALIZADO' };
        if (!isGlobal) {
            whereClause.vehiculo = { idUsuario: idUsuario };
        }

        const viajes = await prisma.viajes.findMany({
            where: whereClause,
            include: {
                ruta: true
            }
        });

        const conteoRutas = {};
        viajes.forEach(v => {
            const nombreRuta = v.ruta?.nombre || `Ruta ${v.idRuta}`;
            conteoRutas[nombreRuta] = (conteoRutas[nombreRuta] || 0) + 1;
        });

        return Object.entries(conteoRutas)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    /**
     * Obtener tiempo en línea
     */
    async obtenerTiempoEnLinea(idUsuario, periodo = 'mensual') {
        const ahora = new Date();
        let fechaInicio;

        if (periodo === 'diario') {
            fechaInicio = new Date(ahora.setHours(0, 0, 0, 0));
        } else if (periodo === 'mensual') {
            fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        } else if (periodo === 'anual') {
            fechaInicio = new Date(ahora.getFullYear(), 0, 1);
        }

        const sesiones = await prisma.sesionesUsuario.findMany({
            where: {
                idUsuario: idUsuario,
                inicio: {
                    gte: fechaInicio
                },
                fin: {
                    not: null
                }
            },
            select: {
                duracionSegundos: true,
                inicio: true
            }
        });

        const totalSegundos = sesiones.reduce((acc, curr) => acc + (curr.duracionSegundos || 0), 0);
        const horas = (totalSegundos / 3600).toFixed(2);

        // Agrupar por subperiodo
        const historial = this.agruparSesionesPorPeriodo(sesiones, periodo);

        return {
            totalHoras: horas,
            historial
        };
    }

    agruparSesionesPorPeriodo(sesiones, periodo) {
        const grupos = {};

        sesiones.forEach(s => {
            let key;
            const fecha = new Date(s.inicio);
            if (periodo === 'diario') {
                key = `${fecha.getHours()}:00`;
            } else if (periodo === 'mensual') {
                key = `Día ${fecha.getDate()}`;
            } else if (periodo === 'anual') {
                const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                key = meses[fecha.getMonth()];
            }

            grupos[key] = (grupos[key] || 0) + (s.duracionSegundos || 0) / 3600;
        });

        return Object.entries(grupos).map(([name, value]) => ({
            name,
            value: Number(value.toFixed(2))
        }));
    }
}

module.exports = new EstadisticasService();
