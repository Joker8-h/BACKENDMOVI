const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const viajeTramosService = {
    // Crear un tramo de viaje
    async createTramo(data) {
        return await prisma.viajeTramos.create({
            data: {
                idViaje: parseInt(data.idViaje),
                idParadaInicio: parseInt(data.idParadaInicio),
                idParadaFin: parseInt(data.idParadaFin),
                asientosTotales: parseInt(data.asientosTotales),
                asientosOcupados: parseInt(data.asientosOcupados) || 0
            }
        });
    },

    // Obtener todos los tramos de un viaje
    async getTramosByViaje(idViaje) {
        return await prisma.viajeTramos.findMany({
            where: { idViaje: parseInt(idViaje) },
            include: {
                paradaInicio: {
                    select: {
                        idParada: true,
                        nombre: true,
                        lat: true,
                        lng: true,
                        orden: true
                    }
                },
                paradaFin: {
                    select: {
                        idParada: true,
                        nombre: true,
                        lat: true,
                        lng: true,
                        orden: true
                    }
                }
            },
            orderBy: [
                { paradaInicio: { orden: 'asc' } }
            ]
        });
    },

    // Obtener un tramo específico
    async getTramo(idViaje, idParadaInicio, idParadaFin) {
        return await prisma.viajeTramos.findUnique({
            where: {
                idViaje_idParadaInicio_idParadaFin: {
                    idViaje: parseInt(idViaje),
                    idParadaInicio: parseInt(idParadaInicio),
                    idParadaFin: parseInt(idParadaFin)
                }
            },
            include: {
                paradaInicio: true,
                paradaFin: true
            }
        });
    },

    // Actualizar asientos ocupados de un tramo
    async updateAsientosOcupados(idViaje, idParadaInicio, idParadaFin, cantidad) {
        const tramo = await this.getTramo(idViaje, idParadaInicio, idParadaFin);

        if (!tramo) {
            throw new Error("Tramo no encontrado");
        }

        const nuevosAsientosOcupados = tramo.asientosOcupados + cantidad;

        if (nuevosAsientosOcupados > tramo.asientosTotales) {
            throw new Error(`No hay suficientes asientos disponibles. Disponibles: ${tramo.asientosTotales - tramo.asientosOcupados}`);
        }

        if (nuevosAsientosOcupados < 0) {
            throw new Error("El número de asientos ocupados no puede ser negativo");
        }

        return await prisma.viajeTramos.update({
            where: {
                idViaje_idParadaInicio_idParadaFin: {
                    idViaje: parseInt(idViaje),
                    idParadaInicio: parseInt(idParadaInicio),
                    idParadaFin: parseInt(idParadaFin)
                }
            },
            data: {
                asientosOcupados: nuevosAsientosOcupados
            }
        });
    },

    // Verificar disponibilidad de asientos en un conjunto de tramos
    async verificarDisponibilidad(idViaje, idParadaInicio, idParadaFin, asientosRequeridos) {
        // Obtener todas las paradas de la ruta del viaje
        const viaje = await prisma.viajes.findUnique({
            where: { idViajes: parseInt(idViaje) },
            include: {
                ruta: {
                    include: {
                        paradas: {
                            orderBy: { orden: 'asc' }
                        }
                    }
                }
            }
        });

        if (!viaje) {
            throw new Error("Viaje no encontrado");
        }

        const paradas = viaje.ruta.paradas;
        const paradaInicioObj = paradas.find(p => p.idParada === parseInt(idParadaInicio));
        const paradaFinObj = paradas.find(p => p.idParada === parseInt(idParadaFin));

        if (!paradaInicioObj || !paradaFinObj) {
            throw new Error("Paradas no encontradas en la ruta");
        }

        if (paradaInicioObj.orden >= paradaFinObj.orden) {
            throw new Error("La parada de inicio debe ser anterior a la parada de fin");
        }

        // Obtener todos los tramos entre las paradas
        const tramosEnRango = await prisma.viajeTramos.findMany({
            where: {
                idViaje: parseInt(idViaje),
                paradaInicio: {
                    orden: {
                        gte: paradaInicioObj.orden,
                        lt: paradaFinObj.orden
                    }
                }
            }
        });

        // Verificar que todos los tramos tengan suficiente capacidad
        for (const tramo of tramosEnRango) {
            const disponibles = tramo.asientosTotales - tramo.asientosOcupados;
            if (disponibles < asientosRequeridos) {
                return {
                    disponible: false,
                    mensaje: `Asientos insuficientes en uno o más tramos. Se requieren ${asientosRequeridos}, disponibles: ${disponibles}`
                };
            }
        }

        return {
            disponible: true,
            mensaje: "Asientos disponibles"
        };
    },

    // Generar tramos automáticamente para un viaje nuevo
    async generarTramosParaViaje(idViaje, cuposTotales) {
        // Obtener la ruta del viaje
        const viaje = await prisma.viajes.findUnique({
            where: { idViajes: parseInt(idViaje) },
            include: {
                ruta: {
                    include: {
                        paradas: {
                            orderBy: { orden: 'asc' }
                        }
                    }
                }
            }
        });

        if (!viaje) {
            throw new Error("Viaje no encontrado");
        }

        const paradas = viaje.ruta.paradas;

        if (paradas.length < 2) {
            throw new Error("La ruta debe tener al menos 2 paradas");
        }

        const tramos = [];

        // Crear un tramo para cada par consecutivo de paradas
        for (let i = 0; i < paradas.length - 1; i++) {
            const tramo = await this.createTramo({
                idViaje: idViaje,
                idParadaInicio: paradas[i].idParada,
                idParadaFin: paradas[i + 1].idParada,
                asientosTotales: cuposTotales,
                asientosOcupados: 0
            });
            tramos.push(tramo);
        }

        return tramos;
    },

    // Eliminar todos los tramos de un viaje
    async deleteTramosDeViaje(idViaje) {
        return await prisma.viajeTramos.deleteMany({
            where: { idViaje: parseInt(idViaje) }
        });
    }
};

module.exports = viajeTramosService;
