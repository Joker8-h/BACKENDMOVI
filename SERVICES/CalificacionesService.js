const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
});

const calificacionesService = {
    async create(data) {
        // Validar que el usuario sea parte del viaje (pendiente)
        return await prisma.calificaciones.create({
            data: {
                idViaje: parseInt(data.idViaje),
                idCalificador: parseInt(data.idCalificador),
                idCalificado: parseInt(data.idCalificado),
                puntuacion: parseInt(data.puntuacion),
                comentario: data.comentario
            }
        });
    },

    async getPromedioUsuario(idUsuario) {
        // Obtener todas las calificaciones recibidas y calcular promedio
        const calificaciones = await prisma.calificaciones.findMany({
            where: { idCalificado: parseInt(idUsuario) }
        });

        if (calificaciones.length === 0) return 0;

        const suma = calificaciones.reduce((acc, curr) => acc + curr.puntuacion, 0);
        return suma / calificaciones.length;
    },

    async getById(id) {
        return await prisma.calificaciones.findUnique({
            where: { idCalificacion: parseInt(id) },
            include: {
                viaje: true,
                calificador: { select: { nombre: true, email: true } },
                calificado: { select: { nombre: true, email: true } }
            }
        });
    }
};

module.exports = calificacionesService;
