const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const documentacionService = {
    // Crear o actualizar documentación para un usuario
    // Se usa upsert para manejar tanto la creación inicial como actualizaciones
    async upsertDocumentacion(idUsuario, data) {
        return await prisma.documentacion.upsert({
            where: {
                idUsuario: parseInt(idUsuario),
            },
            update: {
                tipoDocumento: data.tipoDocumento,
                numeroDocumento: data.numeroDocumento,
                imagenFrontalUrl: data.imagenFrontalUrl,
                imagenDorsalUrl: data.imagenDorsalUrl,
                estado: 'PENDIENTE', // Al actualizar, vuelve a pendiente para revisión
                fechaSubida: new Date(),
            },
            create: {
                idUsuario: parseInt(idUsuario),
                tipoDocumento: data.tipoDocumento,
                numeroDocumento: data.numeroDocumento,
                imagenFrontalUrl: data.imagenFrontalUrl,
                imagenDorsalUrl: data.imagenDorsalUrl,
                estado: 'PENDIENTE',
            },
        });
    },

    // Obtener documentación por ID de usuario
    async getByUsuarioId(idUsuario) {
        return await prisma.documentacion.findUnique({
            where: {
                idUsuario: parseInt(idUsuario),
            },
            include: {
                usuario: {
                    select: {
                        nombre: true,
                        email: true,
                        rol: true
                    }
                }
            }
        });
    },

    // Validar documentación (Solo Admin)
    async updateEstado(idDocumentacion, estado, observaciones) {
        return await prisma.documentacion.update({
            where: {
                idDocumentacion: parseInt(idDocumentacion),
            },
            data: {
                estado: estado,
                observaciones: observaciones,
            },
        });
    }
};

module.exports = documentacionService;
