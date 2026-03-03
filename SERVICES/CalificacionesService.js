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

    async _getTopUsersByRole(roleName, limit = 5) {
        // 1. Obtener el rol
        const rol = await prisma.roles.findUnique({
            where: { nombre: roleName }
        });

        if (!rol) return [];

        // 2. Agrupar calificaciones por usuario calificado, filtrando por el rol del calificado
        const topRatings = await prisma.calificaciones.groupBy({
            by: ['idCalificado'],
            where: {
                calificado: {
                    idRol: rol.idRol,
                    estado: 'ACTIVO'
                }
            },
            _avg: { puntuacion: true },
            _count: { idCalificacion: true },
            orderBy: {
                _avg: { puntuacion: 'desc' }
            },
            take: limit
        });

        if (topRatings.length === 0) return [];

        // 3. Obtener los detalles de los usuarios
        const userIds = topRatings.map(r => r.idCalificado);
        const users = await prisma.usuarios.findMany({
            where: { idUsuarios: { in: userIds } },
            select: {
                idUsuarios: true,
                nombre: true,
                email: true,
                fotoPerfil: true,
                telefono: true
            }
        });

        // 4. Combinar datos
        return topRatings.map(rating => {
            const user = users.find(u => u.idUsuarios === rating.idCalificado);
            return {
                ...user,
                promedioEstrellas: parseFloat((rating._avg.puntuacion || 0).toFixed(2)),
                totalReseñas: rating._count.idCalificacion || 0
            };
        }).sort((a, b) => b.promedioEstrellas - a.promedioEstrellas);
    },

    async getTopConductores(limit = 5) {
        return this._getTopUsersByRole('CONDUCTOR', limit);
    },

    async getTopViajeros(limit = 5) {
        // Intentar con nombres comunes si uno falla
        let results = await this._getTopUsersByRole('VIAJERO', limit);
        if (results.length === 0) {
            results = await this._getTopUsersByRole('PASAJERO', limit);
        }
        return results;
    }
};

module.exports = calificacionesService;
