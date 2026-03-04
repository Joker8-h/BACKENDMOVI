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
        // En lugar de un solo nombre, aceptamos un array de posibles nombres
        const possibleNames = Array.isArray(roleNames) ? roleNames : [roleNames];

        // 1. Obtener los IDs de los roles que coincidan
        const roles = await prisma.roles.findMany({
            where: {
                nombre: {
                    in: possibleNames,
                    // Algunos DBs son case-sensitive, Prisma lo maneja según el provider
                }
            }
        });

        // Si no se encontró el rol exacto, intentamos búsqueda más flexible (case-insensitive si es posible)
        if (roles.length === 0) {
            const allRoles = await prisma.roles.findMany();
            const matchedRoles = allRoles.filter(r =>
                possibleNames.some(name => r.nombre.toUpperCase() === name.toUpperCase())
            );
            roles.push(...matchedRoles);
        }

        let roleIds = roles.map(r => r.idRol);

        // Fallback a IDs conocidos si no se encontraron roles por nombre
        if (roleIds.length === 0) {
            if (possibleNames.includes('CONDUCTOR')) roleIds.push(2);
            if (possibleNames.includes('VIAJERO') || possibleNames.includes('PASAJERO')) roleIds.push(3);
        }

        if (roleIds.length === 0) return [];

        // 2. Agrupar calificaciones por usuario calificado
        const topRatings = await prisma.calificaciones.groupBy({
            by: ['idCalificado'],
            where: {
                calificado: {
                    idRol: { in: roleIds }
                    // Quitamos temporalmente el filtro de estado ACTIVO para depuración
                    // estado: 'ACTIVO'
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
        return topRatings
            .map(rating => {
                const user = users.find(u => u.idUsuarios === rating.idCalificado);
                if (!user) return null;
                return {
                    ...user,
                    promedioEstrellas: parseFloat((rating._avg.puntuacion || 0).toFixed(2)),
                    totalReseñas: rating._count.idCalificacion || 0
                };
            })
            .filter(Boolean)
            .sort((a, b) => b.promedioEstrellas - a.promedioEstrellas);
    },

    async getTopConductores(limit = 5) {
        return this._getTopUsersByRole(['CONDUCTOR', 'DRIVER'], limit);
    },

    async getTopViajeros(limit = 5) {
        return this._getTopUsersByRole(['VIAJERO', 'PASAJERO', 'PASSENGER'], limit);
    }
};

module.exports = calificacionesService;
