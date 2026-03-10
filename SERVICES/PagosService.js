const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
});
const notificacionesService = require("./NotificacionesService");

const pagosService = {
    async create(data) {
        const pago = await prisma.pagos.create({
            data: {
                idUsuario: parseInt(data.idUsuario),
                idViaje: parseInt(data.idViaje),
                monto: data.monto,
                tipoPago: data.tipoPago, // VIAJE, PLAN_CONDUCTOR
                estado: data.estado || 'PENDIENTE',
                confirmacionPasajero: data.confirmacionPasajero || false,
                confirmacionConductor: data.confirmacionConductor || false,
                fechaPago: new Date()
            }
        });

        // NOTIFICACIÓN AUTOMÁTICA
        try {
            await notificacionesService.crearNotificacion({
                idUsuario: parseInt(data.idUsuario),
                titulo: "Pago Registrado",
                mensaje: `Tu pago de $${data.monto} por concepto de ${data.tipoPago} ha sido registrado exitosamente.`,
                tipo: "PAGO"
            });
        } catch (notifError) {
            console.error("Error al crear notificación de pago:", notifError.message);
        }

        return pago;
    },

    async getByUser(idUsuario) {
        return await prisma.pagos.findMany({
            where: { idUsuario: parseInt(idUsuario) },
            include: { viaje: true }
        });
    },

    async getByViaje(idViaje) {
        return await prisma.pagos.findMany({
            where: { idViaje: parseInt(idViaje) },
            include: { usuario: { select: { nombre: true, email: true } } }
        });
    },

    async getByViajeAndUser(idViaje, idUsuario) {
        return await prisma.pagos.findUnique({
            where: {
                idViaje_idUsuario: {
                    idViaje: parseInt(idViaje),
                    idUsuario: parseInt(idUsuario)
                }
            },
            include: { viaje: true }
        });
    },

    async getById(idPago) {
        return await prisma.pagos.findUnique({
            where: { idPago: parseInt(idPago) },
            include: {
                usuario: { select: { nombre: true, email: true } },
                viaje: true
            }
        });
    },

    async updateConfirmacion(idPago, confirmacion) {
        // confirmacion: { confirmacionPasajero: true } o { confirmacionConductor: true }
        return await prisma.pagos.update({
            where: { idPago: parseInt(idPago) },
            data: confirmacion
        });
    }
};

module.exports = pagosService;
