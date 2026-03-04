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
            const possibleNames = Array.isArray(roleNames)
                ? roleNames.map(n => n.toUpperCase().trim())
                : [roleNames.toUpperCase().trim()];

            // Obtenemos TODOS los usuarios calificados con sus roles
            // Esto es más pesado pero asegura encontrar los datos si los nombres de rol varían levemente
            const allRatedUsers = await prisma.$queryRaw`
                SELECT 
                    u.idUsuarios, 
                    u.nombre, 
                    u.email, 
                    u.fotoPerfil, 
                    u.telefono,
                    r.nombre as rolNombre,
                    AVG(c.puntuacion) as promedioEstrellas,
                    COUNT(c.idCalificacion) as totalReseñas
                FROM Usuarios u
                JOIN Calificaciones c ON u.idUsuarios = c.idCalificado
                JOIN Roles r ON u.idRol = r.idRol
                GROUP BY u.idUsuarios, u.nombre, u.email, u.fotoPerfil, u.telefono, r.nombre
                ORDER BY promedioEstrellas DESC, totalReseñas DESC
            `;

            // Filtramos en JS para mayor flexibilidad
            const filtered = allRatedUsers
                .filter(u => {
                    const dbRole = (u.rolNombre || "").toUpperCase().trim();
                    return possibleNames.some(name => dbRole.includes(name));
                })
                .slice(0, limit)
                .map(user => ({
                    ...user,
                    promedioEstrellas: parseFloat(Number(user.promedioEstrellas || 0).toFixed(2)),
                    totalReseñas: Number(user.totalReseñas || 0)
                }));

            return filtered;
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
