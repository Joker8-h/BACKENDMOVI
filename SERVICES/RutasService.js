const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
});

const rutasService = {
    // Crear una nueva ruta
    async createRuta(data) {
        return await prisma.rutas.create({
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
                origen: data.origen,
                estado: 'DISPONIBLE'
            }
        });
    },

    // Agregar parada a una ruta
    async addParada(idRuta, data) {
        return await prisma.paradas.create({
            data: {
                idRuta: parseInt(idRuta),
                nombre: data.nombre,
                lat: data.lat,
                lng: data.lng,
                orden: data.orden,
                tipo: data.tipo || 'AMBAS'
            }
        });
    },

    // Obtener todas las rutas con sus paradas
    async getRutas() {
        return await prisma.rutas.findMany({
            include: {
                paradas: {
                    orderBy: { orden: 'asc' }
                }
            }
        });
    },

    // Obtener una ruta por ID
    async getRutaById(id) {
        return await prisma.rutas.findUnique({
            where: { idRuta: parseInt(id) },
            include: {
                paradas: {
                    orderBy: { orden: 'asc' }
                }
            }
        });
    },

    async updateRuta(id, data) {
        return await prisma.rutas.update({
            where: { idRuta: parseInt(id) },
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
                origen: data.origen,
                estado: data.estado
            }
        });
    },

    async deleteRuta(id) {
        // Opcional: Validar si tiene viajes activos antes de borrar
        return await prisma.rutas.delete({
            where: { idRuta: parseInt(id) }
        });
    },

    async getMisRutasFrecuentes(idUsuario) {
        // Estrategia: Buscar "Viajes" donde el vehículo pertenezca al usuario,
        // y agrupar por idRuta. Como Prisma no hace "DISTINCT ON" complejo fácilmente con include,
        // hacemos un findMany de viajes y extraemos las rutas únicas.

        const viajesDelConductor = await prisma.viajes.findMany({
            where: {
                vehiculo: {
                    idUsuario: parseInt(idUsuario)
                }
            },
            select: {
                idRuta: true
            },
            distinct: ['idRuta'] // Traer ids de rutas únicos
        });

        const idsRutas = viajesDelConductor.map(v => v.idRuta);

        if (idsRutas.length === 0) return [];

        // Ahora traemos los detalles de esas rutas
        return await prisma.rutas.findMany({
            where: {
                idRuta: { in: idsRutas }
            },
            include: {
                paradas: {
                    orderBy: { orden: 'asc' }
                }
            }
        });
    }
};

module.exports = rutasService;
