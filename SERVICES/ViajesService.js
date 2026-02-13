const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
});

const viajesService = {
    async create(data) {
        // Verificar vehículo y capacidad
        const vehiculo = await prisma.vehiculos.findUnique({
            where: { idVehiculos: parseInt(data.idVehiculos) }
        });

        if (!vehiculo) throw new Error("Vehículo no encontrado");

        // La capacidad del viaje es la del vehículo por defecto, o la que se especifique
        const cuposTotales = vehiculo.capacidad;

        return await prisma.viajes.create({
            data: {
                idRuta: parseInt(data.idRuta),
                idVehiculos: parseInt(data.idVehiculos),
                fechaHoraSalida: new Date(data.fechaHoraSalida),
                cuposTotales,
                cuposDisponibles: cuposTotales,
                estado: 'CREADO'
            }
        });
    },

    async buscarViajes(filtros) {
        // Lógica básica de búsqueda, se puede expandir para filtrar por origen/destino de la Ruta
        // Aquí asumimos filtro simple por fecha o mostrar todos los "CREADO" o "PUBLICADO"
        return await prisma.viajes.findMany({
            where: {
                estado: { in: ['CREADO', 'PUBLICADO', 'EN_CURSO'] },
                cuposDisponibles: { gt: 0 }
            },
            include: {
                ruta: true,
                vehiculo: true
            }
        });
    },

    async getById(id) {
        return await prisma.viajes.findUnique({
            where: { idViajes: parseInt(id) },
            include: {
                ruta: { include: { paradas: true } },
                vehiculo: true,
                usuarios: { include: { usuario: true } } // Ver pasajeros(reservas)
            }
        });
    },

    async iniciarViaje(idViaje, idUsuario) {
        const viaje = await this.getById(idViaje);
        if (!viaje) throw new Error("Viaje no encontrado");
        if (viaje.vehiculo.idUsuario !== idUsuario) throw new Error("No autorizado");

        if (viaje.estado !== 'CREADO' && viaje.estado !== 'PUBLICADO') {
            throw new Error("El viaje no se puede iniciar en su estado actual");
        }

        return await prisma.viajes.update({
            where: { idViajes: parseInt(idViaje) },
            data: { estado: 'EN_CURSO' }
        });
    },

    async finalizarViaje(idViaje, idUsuario) {
        const viaje = await this.getById(idViaje);
        if (!viaje) throw new Error("Viaje no encontrado");
        if (viaje.vehiculo.idUsuario !== idUsuario) throw new Error("No autorizado");

        if (viaje.estado !== 'EN_CURSO') {
            throw new Error("Solo se puede finalizar un viaje en curso");
        }

        return await prisma.viajes.update({
            where: { idViajes: parseInt(idViaje) },
            data: { estado: 'FINALIZADO' }
        });
    },

    async cancelarViaje(idViaje, idUsuario) {
        const viaje = await this.getById(idViaje);
        if (!viaje) throw new Error("Viaje no encontrado");
        if (viaje.vehiculo.idUsuario !== idUsuario) throw new Error("No autorizado");

        if (viaje.estado === 'FINALIZADO' || viaje.estado === 'CANCELADO') {
            throw new Error("El viaje ya ha finalizado o sido cancelado");
        }

        return await prisma.viajes.update({
            where: { idViajes: parseInt(idViaje) },
            data: { estado: 'CANCELADO' }
        });
    },

    async getMisViajesConductor(idUsuario) {
        return await prisma.viajes.findMany({
            where: {
                vehiculo: {
                    idUsuario: parseInt(idUsuario)
                }
            },
            include: {
                ruta: true,
                vehiculo: true
            },
            orderBy: {
                fechaHoraSalida: 'desc'
            }
        });
    },

    async obtenerViajesPorDiaSemana(dia) {
        const diasMapa = {
            'lunes': 0,
            'martes': 1,
            'miercoles': 2,
            'jueves': 3,
            'viernes': 4,
            'sabado': 5,
            'domingo': 6
        };

        let diaNum;
        if (isNaN(dia)) {
            const diaNormalizado = dia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            diaNum = diasMapa[diaNormalizado];
        } else {
            diaNum = parseInt(dia);
        }

        if (diaNum === undefined || diaNum < 0 || diaNum > 6) {
            throw new Error("Día no válido. Use el nombre del día (ej. lunes) o un número del 0 (Lunes) al 6 (Domingo).");
        }

        // MySQL WEEKDAY() devuelve 0 para lunes, 1 para martes, ..., 6 para domingo
        // Solo traemos los FINALIZADOS para "viajes realizados"
        const viajes = await prisma.$queryRaw`
            SELECT v.*, r.nombre as rutaNombre, ve.placa, ve.marca, ve.modelo
            FROM Viajes v
            JOIN Rutas r ON v.idRuta = r.idRuta
            JOIN Vehiculos ve ON v.idVehiculos = ve.idVehiculos
            WHERE WEEKDAY(v.fechaHoraSalida) = ${diaNum} AND v.estado = 'FINALIZADO'
        `;

        return viajes;
    }
};

module.exports = viajesService;
