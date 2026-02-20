const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
});
const notificacionesService = require("./NotificacionesService");

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
        const mensaje = await prisma.mensajes.create({
            data: {
                idConversacion: parseInt(data.idConversacion),
                idRemitente: parseInt(data.idRemitente),
                mensaje: data.mensaje,
                tipo: data.tipo || 'TEXTO'
            }
        });

        // NOTIFICACIÓN AUTOMÁTICA
        try {
            const conversacion = await prisma.conversaciones.findUnique({
                where: { idConversacion: parseInt(data.idConversacion) }
            });

            // El destinatario es quien NO envió el mensaje
            const idDestinatario = conversacion.idPasajero === parseInt(data.idRemitente)
                ? conversacion.idConductor
                : conversacion.idPasajero;

            const remitente = await prisma.usuarios.findUnique({
                where: { idUsuarios: parseInt(data.idRemitente) }
            });

            await notificacionesService.crearNotificacion({
                idUsuario: idDestinatario,
                titulo: "Nuevo Mensaje",
                mensaje: `Tienes un nuevo mensaje de ${remitente.nombre}: "${data.mensaje.substring(0, 30)}${data.mensaje.length > 30 ? '...' : ''}"`,
                tipo: "MENSAJE"
            });
        } catch (notifError) {
            console.error("Error al crear notificación de mensaje:", notifError.message);
        }

        return mensaje;
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
