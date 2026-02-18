const pagosService = require("../SERVICES/PagosService");

const pagosController = {
    async create(req, res) {
        try {
            const idUsuario = req.user.id;
            const data = { ...req.body, idUsuario };
            const pago = await pagosService.create(data);
            res.json(pago);
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async getMyPagos(req, res) {
        try {
            const idUsuario = req.user.id;
            const pagos = await pagosService.getByUser(idUsuario);
            res.json(pagos);
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const pago = await pagosService.getById(id);
            if (!pago) return res.status(404).json({ error: "Pago no encontrado" });
            res.json(pago);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = pagosController;
