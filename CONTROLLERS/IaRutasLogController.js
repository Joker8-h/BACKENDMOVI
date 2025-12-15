const iaRutasLogService = require("../SERVICES/IaRutasLogService");

const iaRutasLogController = {
    // Crear un nuevo log
    async create(req, res) {
        try {
            const log = await iaRutasLogService.createLog(req.body);
            res.status(201).json({
                message: "Log creado exitosamente",
                log
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Obtener logs de una ruta
    async getByRuta(req, res) {
        try {
            const { idRuta } = req.params;
            const logs = await iaRutasLogService.getLogsByRuta(idRuta);
            res.json(logs);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Obtener un log por ID
    async getById(req, res) {
        try {
            const { id } = req.params;
            const log = await iaRutasLogService.getLogById(id);

            if (!log) {
                return res.status(404).json({ error: "Log no encontrado" });
            }

            res.json(log);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Obtener todos los logs
    async getAll(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 100;
            const logs = await iaRutasLogService.getAllLogs(limit);
            res.json(logs);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Obtener logs por modelo de IA
    async getByModelo(req, res) {
        try {
            const { modelo } = req.params;
            const logs = await iaRutasLogService.getLogsByModelo(modelo);
            res.json(logs);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Obtener estadísticas
    async getEstadisticas(req, res) {
        try {
            const estadisticas = await iaRutasLogService.getEstadisticas();
            res.json(estadisticas);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Limpiar logs antiguos
    async limpiarAntiguos(req, res) {
        try {
            const dias = req.query.dias ? parseInt(req.query.dias) : 90;
            const resultado = await iaRutasLogService.limpiarLogsAntiguos(dias);
            res.json({
                message: `Logs antiguos eliminados exitosamente`,
                eliminados: resultado.count
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = iaRutasLogController;
