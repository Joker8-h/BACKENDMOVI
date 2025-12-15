const viajesService = require("../SERVICES/ViajesService");

const viajesController = {
    async create(req, res) {
        try {
            const nuevoViaje = await viajesService.create(req.body);
            res.json(nuevoViaje);
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async search(req, res) {
        try {
            const viajes = await viajesService.buscarViajes(req.query);
            res.json(viajes);
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const viaje = await viajesService.getById(id);
            if (!viaje) return res.json({ error: "Viaje no encontrado" });
            res.json(viaje);
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async iniciar(req, res) {
        try {
            const { id } = req.params;
            const idUsuario = req.user.id;
            const viaje = await viajesService.iniciarViaje(id, idUsuario);
            res.json({ message: "Viaje iniciado", viaje });
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async finalizar(req, res) {
        try {
            const { id } = req.params;
            const idUsuario = req.user.id;
            const viaje = await viajesService.finalizarViaje(id, idUsuario);
            res.json({ message: "Viaje finalizado", viaje });
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async cancelar(req, res) {
        try {
            const { id } = req.params;
            const idUsuario = req.user.id;
            const viaje = await viajesService.cancelarViaje(id, idUsuario);
            res.json({ message: "Viaje cancelado", viaje });
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async getMisViajes(req, res) {
        try {
            const idUsuario = req.user.id;
            const viajes = await viajesService.getMisViajesConductor(idUsuario);
            res.json(viajes);
        } catch (error) {
            res.json({ error: error.message });
        }
    },


};

module.exports = viajesController;
