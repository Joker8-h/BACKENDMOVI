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
            res.status(500).json({ error: error.message });
        }
    },

    async getByViaje(req, res) {
        try {
            const { idViaje } = req.params;
            const pagos = await pagosService.getByViaje(idViaje);
            res.json(pagos);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getByViajeAndUser(req, res) {
        try {
            const { idViaje, idUsuario } = req.params;
            const pago = await pagosService.getByViajeAndUser(idViaje, idUsuario);
            if (!pago) return res.status(404).json({ error: "Pago no encontrado para este viaje y usuario" });
            res.json(pago);
        } catch (error) {
            res.status(500).json({ error: error.message });
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
    },

    async updateConfirmacion(req, res) {
        try {
            const { id } = req.params;
            const { confirmacionPasajero, confirmacionConductor } = req.body;

            const updateData = {};
            if (confirmacionPasajero !== undefined) updateData.confirmacionPasajero = confirmacionPasajero;
            if (confirmacionConductor !== undefined) updateData.confirmacionConductor = confirmacionConductor;

            const pago = await pagosService.updateConfirmacion(id, updateData);
            res.json(pago);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async confirmarPasajero(req, res) {
        try {
            const { id } = req.params;
            const pago = await pagosService.confirmarPasajero(id);
            res.json(pago);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async confirmarConductor(req, res) {
        try {
            const { id } = req.params;
            const pago = await pagosService.confirmarConductor(id);
            res.json(pago);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = pagosController;
