const notificacionesService = require("../SERVICES/NotificacionesService");

const notificacionesController = {
    async crear(req, res) {
        try {
            const notificacion = await notificacionesService.crearNotificacion(req.body);
            res.status(201).json(notificacion);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async getPorUsuario(req, res) {
        try {
            const { idUsuario } = req.params;
            const notificaciones = await notificacionesService.obtenerNotificacionesUsuario(idUsuario);
            res.json(notificaciones);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async marcarLeida(req, res) {
        try {
            const { id } = req.params;
            const updated = await notificacionesService.marcarComoLeida(id);
            res.json(updated);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async marcarTodasLeidas(req, res) {
        try {
            const { idUsuario } = req.params;
            const result = await notificacionesService.marcarTodasComoLeidas(idUsuario);
            res.json({ mensaje: "Todas las notificaciones marcadas como leídas", count: result.count });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async eliminar(req, res) {
        try {
            const { id } = req.params;
            await notificacionesService.eliminarNotificacion(id);
            res.json({ mensaje: "Notificación eliminada correctamente" });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async getContadorNoLeidas(req, res) {
        try {
            const { idUsuario } = req.params;
            const count = await notificacionesService.obtenerNoLeidasContador(idUsuario);
            res.json({ noLeidas: count });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = notificacionesController;
