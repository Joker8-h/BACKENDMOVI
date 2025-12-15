const viajeTramosService = require("../SERVICES/ViajeTramosService");

const viajeTramosController = {
    // Obtener tramos de un viaje
    async getByViaje(req, res) {
        try {
            const { idViaje } = req.params;
            const tramos = await viajeTramosService.getTramosByViaje(idViaje);
            res.json(tramos);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Obtener un tramo específico
    async getTramo(req, res) {
        try {
            const { idViaje, idParadaInicio, idParadaFin } = req.params;
            const tramo = await viajeTramosService.getTramo(idViaje, idParadaInicio, idParadaFin);

            if (!tramo) {
                return res.status(404).json({ error: "Tramo no encontrado" });
            }

            res.json(tramo);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Crear un tramo
    async create(req, res) {
        try {
            const tramo = await viajeTramosService.createTramo(req.body);
            res.status(201).json({
                message: "Tramo creado exitosamente",
                tramo
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Actualizar ocupación de asientos
    async updateOcupacion(req, res) {
        try {
            const { idViaje, idParadaInicio, idParadaFin, cantidad } = req.body;

            const tramo = await viajeTramosService.updateAsientosOcupados(
                idViaje,
                idParadaInicio,
                idParadaFin,
                cantidad
            );

            res.json({
                message: "Ocupación actualizada exitosamente",
                tramo
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Verificar disponibilidad
    async verificarDisponibilidad(req, res) {
        try {
            const { idViaje, idParadaInicio, idParadaFin, asientosRequeridos } = req.body;

            const resultado = await viajeTramosService.verificarDisponibilidad(
                idViaje,
                idParadaInicio,
                idParadaFin,
                asientosRequeridos
            );

            res.json(resultado);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Generar tramos para un viaje
    async generarTramos(req, res) {
        try {
            const { idViaje, cuposTotales } = req.body;

            const tramos = await viajeTramosService.generarTramosParaViaje(idViaje, cuposTotales);

            res.status(201).json({
                message: "Tramos generados exitosamente",
                tramos,
                count: tramos.length
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = viajeTramosController;
