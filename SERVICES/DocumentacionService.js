const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const documentacionService = {

  // Crear o actualizar documentación por usuario (SIN UNIQUE)
  async upsertDocumentacion(idUsuario, data) {
    if (!idUsuario) {
      throw new Error("idUsuario es obligatorio");
    }

    // Buscar si ya existe documentación del usuario
    const existente = await prisma.documentacion.findFirst({
      where: {
        idUsuario: Number(idUsuario),
      },
      orderBy: {
        fechaSubida: "desc", // toma la más reciente
      },
    });

    if (existente) {
      // UPDATE
      return await prisma.documentacion.update({
        where: {
          idDocumentacion: existente.idDocumentacion,
        },
        data: {
          tipoDocumento: data.tipoDocumento,
          numeroDocumento: data.numeroDocumento,
          imagenFrontalUrl: data.imagenFrontalUrl,
          imagenDorsalUrl: data.imagenDorsalUrl,
          estado: "PENDIENTE",
          fechaSubida: new Date(),
        },
      });
    }

    // CREATE
    return await prisma.documentacion.create({
      data: {
        idUsuario: Number(idUsuario),
        tipoDocumento: data.tipoDocumento,
        numeroDocumento: data.numeroDocumento,
        imagenFrontalUrl: data.imagenFrontalUrl,
        imagenDorsalUrl: data.imagenDorsalUrl,
        estado: "PENDIENTE",
        fechaSubida: new Date(),
      },
    });
  },

  // Obtener documentación por ID de usuario
  async getByUsuarioId(idUsuario) {
    if (!idUsuario) {
      throw new Error("idUsuario es obligatorio");
    }

    return await prisma.documentacion.findMany({
      where: {
        idUsuario: Number(idUsuario),
      },
      orderBy: {
        fechaSubida: "desc",
      },
      include: {
        usuario: {
          select: {
            idUsuarios: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
      },
    });
  },

  // Cambiar estado (ADMIN)
  async updateEstado(idDocumentacion, estado, observaciones) {
    if (!idDocumentacion) {
      throw new Error("idDocumentacion es obligatorio");
    }

    if (!estado) {
      throw new Error("estado es obligatorio");
    }

    return await prisma.documentacion.update({
      where: {
        idDocumentacion: Number(idDocumentacion),
      },
      data: {
        estado,
        observaciones: observaciones || null,
      },
    });
  },

  async getById(id) {
    return await prisma.documentacion.findUnique({
      where: {
        idDocumentacion: Number(id),
      },
      include: {
        usuario: {
          select: {
            idUsuarios: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
      },
    });
  },
};

module.exports = documentacionService;
