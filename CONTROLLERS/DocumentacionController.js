const documentacionService = require('../SERVICES/DocumentacionService');

const documentacionController = {

  // Subir o actualizar documentos
  async upload(req, res) {
    try {
      console.log("USUARIO JWT 👉", req.usuario);

      // 👇 USÁ EL ID CORRECTO
      const idUsuario = req.usuario.idUsuarios;

      if (!idUsuario) {
        return res.status(400).json({
          error: "No se pudo obtener el id del usuario autenticado"
        });
      }

      const data = req.body;

      if (!data.tipoDocumento || !data.numeroDocumento) {
        return res.status(400).json({
          error: "Faltan campos obligatorios (tipoDocumento, numeroDocumento)"
        });
      }

      const doc = await documentacionService.upsertDocumentacion(
        idUsuario,
        data
      );

      res.status(200).json({
        message: "Documentación guardada exitosamente",
        doc
      });

    } catch (error) {
      console.error("ERROR REAL 👉", error);
      res.status(500).json({
        error: "Error al guardar la documentación",
        detalle: error.message
      });
    }
  },

  // Obtener mis documentos
  async getMyDocs(req, res) {
    try {
      const idUsuario = req.usuario.idUsuarios;

      if (!idUsuario) {
        return res.status(400).json({
          error: "No se pudo obtener el id del usuario"
        });
      }

      const docs = await documentacionService.getByUsuarioId(idUsuario);

      if (!docs || docs.length === 0) {
        return res.json({
          message: "No se encontró documentación para este usuario"
        });
      }

      res.json(docs);

    } catch (error) {
      console.error("ERROR REAL 👉", error);
      res.status(500).json({
        error: "Error al obtener documentación",
        detalle: error.message
      });
    }
  },

  // Validar documentos (ADMIN)
  async validate(req, res) {
    try {
      const { id } = req.params;
      const { estado, observaciones } = req.body;

      if (!['APROBADO', 'RECHAZADO'].includes(estado)) {
        return res.status(400).json({
          error: "Estado inválido. Debe ser APROBADO o RECHAZADO"
        });
      }

      const doc = await documentacionService.updateEstado(
        id,
        estado,
        observaciones
      );

      res.json({
        message: `Documentación marcada como ${estado}`,
        doc
      });

    } catch (error) {
      console.error("ERROR REAL 👉", error);
      res.status(500).json({
        error: "Error al validar documentación",
        detalle: error.message
      });
    }
  }
};

module.exports = documentacionController;
