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
        const agregacion = await prisma.calificaciones.aggregate({
            where: { idCalificado: parseInt(idUsuario) },
            _avg: { puntuacion: true },
            _count: { idCalificacion: true }
        });

        return {
            promedio: agregacion._avg.puntuacion || 0,
            total: agregacion._count.idCalificacion || 0
        };
    },

    async _getTopUsersByRole(roleNames, limit = 5) {
        try {
            const possibleNames = Array.isArray(roleNames) ? roleNames : [roleNames];

            // Usamos queryRaw para un control total sobre JOINs y agrupaciones
            // Esto evita problemas con Prisma groupBy y relaciones complejas
            const topUsers = await prisma.$queryRaw`
                SELECT 
                    u.idUsuarios, 
                    u.nombre, 
                    u.email, 
                    u.fotoPerfil, 
                    u.telefono,
                    AVG(c.puntuacion) as promedioEstrellas,
                    COUNT(c.idCalificacion) as totalReseñas
                FROM Usuarios u
                JOIN Calificaciones c ON u.idUsuarios = c.idCalificado
                JOIN Roles r ON u.idRol = r.idRol
                WHERE r.nombre IN (${possibleNames[0]}, ${possibleNames[1] || possibleNames[0]}, ${possibleNames[2] || possibleNames[0]})
                GROUP BY u.idUsuarios
                ORDER BY promedioEstrellas DESC, totalReseñas DESC
                LIMIT ${parseInt(limit)}
            `;

            return topUsers.map(user => ({
                ...user,
                // queryRaw a veces devuelve tipos especiales o strings para AVG/COUNT
                promedioEstrellas: parseFloat(Number(user.promedioEstrellas || 0).toFixed(2)),
                totalReseñas: Number(user.totalReseñas || 0)
            }));

        } catch (error) {
            console.error("Error en _getTopUsersByRole (queryRaw):", error);
            return [];
        }
    },

    async getTopConductores(limit = 5) {
        return this._getTopUsersByRole(['CONDUCTOR', 'DRIVER'], limit);
    },

    async getTopViajeros(limit = 5) {
        return this._getTopUsersByRole(['VIAJERO', 'PASAJERO', 'PASSENGER'], limit);
    }
};

module.exports = calificacionesService;
