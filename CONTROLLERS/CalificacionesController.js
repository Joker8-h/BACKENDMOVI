const calificacionesService = require("../SERVICES/CalificacionesService");

const calificacionesController = {
    async create(req, res) {
        try {
            const idCalificador = req.user.id;
            const data = { ...req.body, idCalificador };
            const nueva = await calificacionesService.create(data);
            res.json(nueva);
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async getPromedio(req, res) {
        try {
            const { idUsuario } = req.params;
            const promedio = await calificacionesService.getPromedioUsuario(idUsuario);
            res.json({ promedio });
        } catch (error) {
            res.json({ error: error.message });
        }
    }
};

module.exports = calificacionesController;
