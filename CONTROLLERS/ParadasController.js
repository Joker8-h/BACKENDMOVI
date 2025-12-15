const paradasService = require("../SERVICES/ParadasService");

const paradasController = {
    // Crear una nueva parada
    async create(req, res) {
        try {
            const parada = await paradasService.createParada(req.body);
            res.status(201).json({
                message: "Parada creada exitosamente",
                parada
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Obtener paradas de una ruta
    async getByRuta(req, res) {
        try {
            const { idRuta } = req.params;
            const paradas = await paradasService.getParadasByRuta(idRuta);
            res.json(paradas);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Obtener todas las paradas
    async getAll(req, res) {
        try {
            const paradas = await paradasService.getAllParadas();
            res.json(paradas);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Obtener parada por ID
    async getById(req, res) {
        try {
            const { id } = req.params;
            const parada = await paradasService.getParadaById(id);

            if (!parada) {
                return res.status(404).json({ error: "Parada no encontrada" });
            }

            res.json(parada);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Actualizar parada
    async update(req, res) {
        try {
            const { id } = req.params;
            const parada = await paradasService.updateParada(id, req.body);
            res.json({
                message: "Parada actualizada exitosamente",
                parada
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Eliminar parada
    async delete(req, res) {
        try {
            const { id } = req.params;
            await paradasService.deleteParada(id);
            res.json({ message: "Parada eliminada exitosamente" });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = paradasController;
