const planesConductorService = require("../SERVICES/PlanesConductorService");

const planesConductorController = {
    // Listar todos los planes
    async getAll(req, res) {
        try {
            const planes = await planesConductorService.getAllPlanes();
            res.json(planes);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Listar solo planes activos
    async getActivos(req, res) {
        try {
            const planes = await planesConductorService.getPlanesActivos();
            res.json(planes);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Obtener plan por ID
    async getById(req, res) {
        try {
            const { id } = req.params;
            const plan = await planesConductorService.getPlanById(id);

            if (!plan) {
                return res.status(404).json({ error: "Plan no encontrado" });
            }

            res.json(plan);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Crear nuevo plan
    async create(req, res) {
        try {
            const plan = await planesConductorService.createPlan(req.body);
            res.status(201).json({
                message: "Plan creado exitosamente",
                plan
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Actualizar plan
    async update(req, res) {
        try {
            const { id } = req.params;
            const plan = await planesConductorService.updatePlan(id, req.body);
            res.json({
                message: "Plan actualizado exitosamente",
                plan
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Desactivar plan (soft delete)
    async delete(req, res) {
        try {
            const { id } = req.params;
            const plan = await planesConductorService.deletePlan(id);
            res.json({
                message: "Plan desactivado exitosamente",
                plan
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = planesConductorController;
