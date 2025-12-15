const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
});

const reservasService = {
    // Crear reserva (Usuario reserva un viaje)
    async crearReserva(idUsuario, data) {
        // 1. Verificar viaje existente
        const viaje = await prisma.viajes.findUnique({
            where: { idViajes: parseInt(data.idViajes) }
        });

        if (!viaje) throw new Error("Viaje no encontrado");

        // 2. Verificar cupos disponibles
        if (viaje.cuposDisponibles <= 0) {
            throw new Error("No hay cupos disponibles en este viaje.");
        }

        // 3. Crear reserva y descontar cupo en una transacción
        return await prisma.$transaction(async (tx) => {
            const reserva = await tx.usuarioViaje.create({
                data: {
                    idUsuarios: idUsuario,
                    idViajes: parseInt(data.idViajes),
                    idParadaSubida: parseInt(data.idParadaSubida),
                    idParadaBajada: parseInt(data.idParadaBajada),
                    asientosReservados: 1,
                    estado: 'RESERVADO'
                }
            });

            // Actualizar cupos del viaje
            await tx.viajes.update({
                where: { idViajes: viaje.idViajes },
                data: { cuposDisponibles: { decrement: 1 } }
            });

            return reserva;
        });
    },

    // Obtener mis reservas (Pasajero)
    async getMisReservas(idUsuario) {
        return await prisma.usuarioViaje.findMany({
            where: { idUsuarios: idUsuario },
            include: {
                viaje: {
                    include: {
                        ruta: true, // Para ver origen/destino del viaje
                        vehiculo: true
                    }
                },
                paradaSubida: true,
                paradaBajada: true
            }
        });
    },

    // Cancelar reserva
    async cancelarReserva(idUsuario, idViaje) {
        // Verificar que la reserva exista y sea del usuario (idUsuario, idViaje es clave compuesta)
        const reserva = await prisma.usuarioViaje.findUnique({
            where: {
                idUsuarios_idViajes: {
                    idUsuarios: idUsuario,
                    idViajes: parseInt(idViaje)
                }
            }
        });

        if (!reserva) throw new Error("Reserva no encontrada");

        if (reserva.estado === 'CANCELADO') throw new Error("La reserva ya está cancelada");

        // Transacción para actualizar estado y devolver cupo
        return await prisma.$transaction(async (tx) => {
            const actualizada = await tx.usuarioViaje.update({
                where: {
                    idUsuarios_idViajes: {
                        idUsuarios: idUsuario,
                        idViajes: parseInt(idViaje)
                    }
                },
                data: { estado: 'CANCELADO' }
            });

            await tx.viajes.update({
                where: { idViajes: parseInt(idViaje) },
                data: { cuposDisponibles: { increment: 1 } }
            });

            return actualizada;
        });
    }
};

module.exports = reservasService;
