const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
});

const chatService = {

    async initConversacion(data) {
        const existente = await prisma.conversaciones.findFirst({
            where: {
                idViaje: parseInt(data.idViaje),
                idPasajero: parseInt(data.idPasajero),
                idConductor: parseInt(data.idConductor)
            }
        });

        if (existente) return existente;

        return await prisma.conversaciones.create({
            data: {
                idViaje: parseInt(data.idViaje),
                idPasajero: parseInt(data.idPasajero),
                idConductor: parseInt(data.idConductor),
                estado: 'ACTIVA'
            }
        });
    },

    async enviarMensaje(data) {
        return await prisma.mensajes.create({
            data: {
                idConversacion: parseInt(data.idConversacion),
                idRemitente: parseInt(data.idRemitente),
                mensaje: data.mensaje,
                tipo: data.tipo || 'TEXTO'
            }
        });
    },

    async getConversacionesUsuario(idUsuario) {
        // Buscar conversaciones donde el usuario es pasajero O conductor
        return await prisma.conversaciones.findMany({
            where: {
                OR: [
                    { idPasajero: idUsuario },
                    { idConductor: idUsuario }
                ]
            },
            include: {
                viaje: { select: { idViajes: true, fechaHoraSalida: true } },
                pasajero: { select: { nombre: true, email: true } },
                conductor: { select: { nombre: true, email: true } },
                mensajes: {
                    take: 1,
                    orderBy: { fechaEnvio: 'desc' }
                }
            }
        });
    },

    async getMensajes(idConversacion) {
        return await prisma.mensajes.findMany({
            where: { idConversacion: parseInt(idConversacion) },
            orderBy: { fechaEnvio: 'asc' }
        });
    },

    async getConversacionById(id) {
        return await prisma.conversaciones.findUnique({
            where: { idConversacion: parseInt(id) },
            include: {
                viaje: { select: { idViajes: true, fechaHoraSalida: true, ruta: true } },
                pasajero: { select: { nombre: true, email: true, fotoPerfil: true } },
                conductor: { select: { nombre: true, email: true, fotoPerfil: true } },
                mensajes: {
                    orderBy: { fechaEnvio: 'asc' }
                }
            }
        });
    }
};

module.exports = chatService;
