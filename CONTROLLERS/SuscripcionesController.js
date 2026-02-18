const suscripcionesService = require("../SERVICES/SuscripcionesService");

const suscripcionesController = {
    async createPlan(req, res) {
        try {
            const plan = await suscripcionesService.createPlan(req.body);
            res.json(plan);
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async getPlanes(req, res) {
        try {
            const planes = await suscripcionesService.getPlanes();
            res.json(planes);
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async suscribirse(req, res) {
        try {
            const idUsuario = req.user.id;
            const data = { ...req.body, idUsuario };
            const suscripcion = await suscripcionesService.suscribirse(data);
            res.json(suscripcion);
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async getMiSuscripcion(req, res) {
        try {
            const idUsuario = req.user.id;
            const suscripcion = await suscripcionesService.getMiSuscripcion(idUsuario);
            res.json(suscripcion || { message: "No tienes una suscripción activa" });
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const suscripcion = await suscripcionesService.getById(id);
            if (!suscripcion) return res.status(404).json({ error: "Suscripción no encontrada" });
            res.json(suscripcion);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = suscripcionesController;
