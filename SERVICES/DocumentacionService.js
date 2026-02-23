const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const notificacionesService = require("./NotificacionesService");

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
    const aiService = require("./AiObjectRecognitionService");
    let initialEstado = "PENDIENTE";
    let initialObservaciones = null;

    // Validación automática de Fraude en Licencias
    if (data.tipoDocumento === "LICENCIA" && data.imagenFrontalUrl) {
      try {
        const validacion = await aiService.verificarAutenticidad(data.imagenFrontalUrl);

        // Usar datos extraídos si están disponibles
        if (validacion.extracted_data && validacion.extracted_data.numerolic && !data.numeroDocumento) {
          data.numeroDocumento = validacion.extracted_data.numerolic;
        }

        if (validacion.sospecha_fraude) {
          initialEstado = "RECHAZADO";
          initialObservaciones = "RECHAZO AUTOMÁTICO IA: Se detectó posible fraude o elementos faltantes en el documento. Requiere revisión manual urgente.";
        } else if (validacion.confianza > 0.95) {
          initialEstado = "APROBADO";
          initialObservaciones = "APROBACIÓN AUTOMÁTICA IA: Documento verificado con alta confianza y datos extraídos correctamente.";
        }
      } catch (aiError) {
        console.error("Fallo silencioso en verificación IA:", aiError.message);
      }
    }

    return await prisma.documentacion.create({
      data: {
        idUsuario: Number(idUsuario),
        tipoDocumento: data.tipoDocumento,
        numeroDocumento: data.numeroDocumento || "PENDIENTE_EXTRAER",
        imagenFrontalUrl: data.imagenFrontalUrl,
        imagenDorsalUrl: data.imagenDorsalUrl,
        estado: initialEstado,
        observaciones: initialObservaciones || "Documentación en proceso de revisión.",
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

    const actualizada = await prisma.documentacion.update({
      where: {
        idDocumentacion: Number(idDocumentacion),
      },
      data: {
        estado,
        observaciones: observaciones || null,
      },
    });

    // NOTIFICACIÓN AUTOMÁTICA
    try {
      await notificacionesService.crearNotificacion({
        idUsuario: actualizada.idUsuario,
        titulo: `Documentación ${estado === 'APROBADO' ? 'Aprobada' : 'Rechazada'}`,
        mensaje: estado === 'APROBADO'
          ? "¡Felicidades! Tu documentación ha sido aprobada. Ya puedes empezar a realizar viajes."
          : `Tu documentación ha sido rechazada. Motivo: ${observaciones || 'No especificado'}. Por favor, vuelve a subirla correctamente.`,
        tipo: "SISTEMA"
      });
    } catch (notifError) {
      console.error("Error al crear notificación de documentación:", notifError.message);
    }

    return actualizada;
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
