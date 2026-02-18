const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
});

const suscripcionesService = {
    // Planes (Admin)
    async createPlan(data) {
        return await prisma.planesConductor.create({
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
                tipo: data.tipo, // SEMANAL, MENSUAL
                precio: data.precio,
                maxViajes: data.maxViajes ? parseInt(data.maxViajes) : null,
                porcentajeComision: data.porcentajeComision,
                activo: true
            }
        });
    },

    async getPlanes() {
        return await prisma.planesConductor.findMany({
            where: { activo: true }
        });
    },

    // Suscripciones (Conductor)
    async suscribirse(data) {
        // Calcular fechas
        const fechaInicio = new Date();
        const plan = await prisma.planesConductor.findUnique({
            where: { idPlan: parseInt(data.idPlan) }
        });

        if (!plan) throw new Error("Plan no encontrado");

        let fechaFin = new Date();
        if (plan.tipo === 'SEMANAL') {
            fechaFin.setDate(fechaFin.getDate() + 7);
        } else if (plan.tipo === 'MENSUAL') {
            fechaFin.setMonth(fechaFin.getMonth() + 1);
        }

        return await prisma.suscripcionesConductor.create({
            data: {
                idUsuario: parseInt(data.idUsuario),
                idPlan: parseInt(data.idPlan),
                fechaInicio,
                fechaFin,
                estado: 'ACTIVA',
                renovacionAutomatica: data.renovacionAutomatica || false
            }
        });
    },

    async getMiSuscripcion(idUsuario) {
        return await prisma.suscripcionesConductor.findFirst({
            where: { idUsuario: idUsuario, estado: 'ACTIVA' },
            include: { plan: true }
        });
    },

    async getById(id) {
        return await prisma.suscripcionesConductor.findUnique({
            where: { idSuscripcion: parseInt(id) },
            include: {
                usuario: { select: { nombre: true, email: true } },
                plan: true
            }
        });
    }
};

module.exports = suscripcionesService;
