const reservasService = require("../SERVICES/ReservasService");

const reservasController = {
    async create(req, res) {
        try {
            const idUsuario = req.user.id;
            const reserva = await reservasService.crearReserva(idUsuario, req.body);
            res.json(reserva);
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async getMisReservas(req, res) {
        try {
            const idUsuario = req.user.id;
            const reservas = await reservasService.getMisReservas(idUsuario);
            res.json(reservas);
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async cancelar(req, res) {
        try {
            const idUsuario = req.user.id;
            const { idViaje } = req.params; // La cancelación requiere ID del viaje pq la PK es compuesta
            const resultado = await reservasService.cancelarReserva(idUsuario, idViaje);
            res.json({ message: "Reserva cancelada exitosamente", resultado });
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async getById(req, res) {
        try {
            const { idUsuarios, idViajes } = req.params;
            const reserva = await reservasService.getById(idUsuarios, idViajes);
            if (!reserva) return res.status(404).json({ error: "Reserva no encontrada" });
            res.json(reserva);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = reservasController;
