const documentacionService = require("../SERVICES/DocumentacionService");

const documentacionController = {

    // Subir o actualizar documentación (usuario autenticado)
    async upload(req, res) {
        try {
            // Validar autenticación
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    error: "Usuario no autenticado"
                });
            }

            const idUsuario = req.user.id;
            const data = req.body;

            // Validaciones básicas
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
            console.error("ERROR REAL ", error);
            res.status(500).json({
                error: "Error al guardar la documentación",
                detalle: error.message
            });
        }
    },

    // Obtener mis documentos
    async getMyDocs(req, res) {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    error: "Usuario no autenticado"
                });
            }

            const idUsuario = req.user.id;
            const docs = await documentacionService.getByUsuarioId(idUsuario);

            if (!docs || docs.length === 0) {
                return res.json({
                    message: "No se encontró documentación para este usuario"
                });
            }

            res.status(200).json(docs);

        } catch (error) {
            console.error("ERROR REAL ", error);
            res.status(500).json({
                error: "Error al obtener documentación",
                detalle: error.message
            });
        }
    },

    // Validar documentación (ADMIN)
    async validate(req, res) {
        try {
            const { id } = req.params;
            const { estado, observaciones } = req.body;

            if (!id) {
                return res.status(400).json({
                    error: "idDocumentacion es obligatorio"
                });
            }

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

            res.status(200).json({
                message: `Documentación marcada como ${estado}`,
                doc
            });

        } catch (error) {
            console.error("ERROR REAL ", error);
            res.status(500).json({
                error: "Error al validar documentación",
                detalle: error.message
            });
        }
    }
};

module.exports = documentacionController;
