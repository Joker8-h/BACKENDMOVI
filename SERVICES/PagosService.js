const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
});

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
