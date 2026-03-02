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

    async getTopConductores(limit = 10) {
        // 1. Obtener el ID del rol 'CONDUCTOR'
        const rolConductor = await prisma.roles.findUnique({
            where: { nombre: 'CONDUCTOR' }
        });

        if (!rolConductor) return [];

        // 2. Buscar usuarios con ese rol e incluir sus calificaciones recibidas
        const conductores = await prisma.usuarios.findMany({
            where: {
                idRol: rolConductor.idRol,
                estado: 'ACTIVO'
            },
            include: {
                calificacionesRecibidas: {
                    select: { puntuacion: true }
                }
            }
        });

        // 3. Calcular el promedio para cada conductor
        const conductoresConPromedio = conductores.map(c => {
            const totalCalificaciones = c.calificacionesRecibidas.length;
            const promedio = totalCalificaciones > 0
                ? c.calificacionesRecibidas.reduce((acc, curr) => acc + curr.puntuacion, 0) / totalCalificaciones
                : 0;

            // Eliminar el array de calificaciones para la respuesta
            const { calificacionesRecibidas, passwordHash, ...datosPublicos } = c;
            return {
                ...datosPublicos,
                promedioEstrellas: parseFloat(promedio.toFixed(2)),
                totalReseñas: totalCalificaciones
            };
        });

        // 4. Ordenar por promedio descendente y tomar los mejores
        return conductoresConPromedio
            .sort((a, b) => b.promedioEstrellas - a.promedioEstrellas)
            .slice(0, limit);
    }
};

module.exports = calificacionesService;
