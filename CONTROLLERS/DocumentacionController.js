const documentacionService = require('../SERVICES/DocumentacionService');

const documentacionController = {
    // Subir o actualizar documentos
    async upload(req, res) {
        try {
            const idUsuario = req.usuario.id;
            const data = req.body;

            // Validación básica
            if (!data.tipoDocumento || !data.numeroDocumento) {
                return res.json({
                    error: 'Faltan campos obligatorios (tipoDocumento, numeroDocumento)'
                });
            }

            const doc = await documentacionService.upsertDocumentacion(idUsuario, data);
            res.json({ message: 'Documentación guardada exitosamente', doc });
        } catch (error) {
            console.error(error);
            res.json({ error: 'Error al guardar la documentación' });
        }
    },

    // Obtener mis documentos
    async getMyDocs(req, res) {
        try {
            const idUsuario = req.usuario.id;
            const doc = await documentacionService.getByUsuarioId(idUsuario);

            if (!doc) {
                return res.json({ message: 'No se encontró documentación para este usuario' });
            }

            res.json(doc);
        } catch (error) {
            console.error(error);
            res.json({ error: 'Error al obtener documentación' });
        }
    },

    // Validar documentos (ADMIN)
    async validate(req, res) {
        try {
            const { id } = req.params;
            const { estado, observaciones } = req.body;

            if (!['APROBADO', 'RECHAZADO'].includes(estado)) {
                return res.json({ error: 'Estado inválido. Debe ser APROBADO o RECHAZADO' });
            }

            const doc = await documentacionService.updateEstado(id, estado, observaciones);
            res.json({ message: `Documentación marcada como ${estado}`, doc });
        } catch (error) {
            console.error(error);
            res.json({ error: 'Error al validar documentación' });
        }
    }
};

module.exports = documentacionController;
