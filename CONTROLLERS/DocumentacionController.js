const documentacionService = require("../SERVICES/DocumentacionService");
const cloudinaryService = require("../SERVICES/CloudinaryService");

const documentacionController = {

    // Subir o actualizar documentación (usuario autenticado)
    async upload(req, res) {
        try {
            // Validar autenticación
            const idUsuario = req.user.id;
            const data = req.body;

            // Validaciones básicas
            if (!data.tipoDocumento) {
                return res.status(400).json({
                    error: "Faltan campos obligatorios (tipoDocumento)"
                });
            }

            // Si viene una imagen en base64 (como en Moviflex_con_React), la subimos a Cloudinary
            if (data.imagenFrontal && !data.imagenFrontalUrl) {
                console.log("[DocumentacionController] Detectada imagen Base64, subiendo a Cloudinary...");
                data.imagenFrontalUrl = await cloudinaryService.subirImagen(data.imagenFrontal, "documentacion");
            }

            // Normalizar campos obligatorios si no vienen pero hay OCR
            const doc = await documentacionService.upsertDocumentacion(
                idUsuario,
                data
            );

            // Mapear respuesta para el frontend (Moviflex_con_React espera datosLicencia)
            const response = {
                message: "Documentación guardada exitosamente",
                doc,
                datosLicencia: doc.datosOcr ? {
                    nombre: doc.datosOcr.nombre || "No detectado",
                    identificacion: doc.datosOcr.numerolic || "No detectado",
                    fechaExpedicion: doc.datosOcr.fechaexpedicion || null,
                    fechaVencimiento: doc.datosOcr.fechavencimiento || null,
                    categoria: doc.datosOcr.categoria || "B1"
                } : null
            };

            res.status(200).json(response);

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
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const doc = await documentacionService.getById(id);
            if (!doc) return res.status(404).json({ error: "Documentación no encontrada" });
            res.json(doc);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = documentacionController;
