const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
});
const notificacionesService = require("./NotificacionesService");

const pagosService = {
    async create(data) {
        return await prisma.pagos.create({
            data: {
                idUsuario: parseInt(data.idUsuario),
                monto: data.monto,
                tipoPago: data.tipoPago, // VIAJE, PLAN_CONDUCTOR
                estado: 'PENDIENTE', // Por defecto
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
            where: { idUsuario: idUsuario }
        });
    },

    async getById(idPago) {
        return await prisma.pagos.findUnique({
            where: { idPago: parseInt(idPago) },
            include: { usuario: { select: { nombre: true, email: true } } }
        });
    }
};

module.exports = pagosService;
