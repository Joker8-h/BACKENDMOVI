const estadisticasService = require('../SERVICES/EstadisticasService');

class EstadisticasController {
    async getGanancias(req, res) {
        try {
            const { idUsuarios, rol } = req.user;
            const { periodo } = req.query; // diario, mensual, anual

            // Solo conductores pueden ver ganancias
            if (!rol.includes('CONDUCTOR') && !rol.includes('ADMIN')) {
                return res.status(403).json({ message: "No tienes permiso para ver ganancias" });
            }

            const data = await estadisticasService.obtenerGananciasConductor(idUsuarios, periodo);
            res.json(data);
        } catch (error) {
            console.error("Error en getGanancias:", error);
            res.status(500).json({ message: "Error al obtener ganancias" });
        }
    }

    async getResumenViajes(req, res) {
        try {
            const { idUsuarios, rol } = req.user;
            const data = await estadisticasService.obtenerResumenViajes(idUsuarios, rol);
            res.json(data);
        } catch (error) {
            console.error("Error en getResumenViajes:", error);
            res.status(500).json({ message: "Error al obtener resumen de viajes" });
        }
    }

    async getMejoresRutas(req, res) {
        try {
            const { idUsuarios, rol } = req.user;

            if (!rol.includes('CONDUCTOR') && !rol.includes('ADMIN')) {
                return res.status(403).json({ message: "No tienes permiso para ver mejores rutas" });
            }

            const data = await estadisticasService.obtenerMejoresRutas(idUsuarios);
            res.json(data);
        } catch (error) {
            console.error("Error en getMejoresRutas:", error);
            res.status(500).json({ message: "Error al obtener mejores rutas" });
        }
    }

    async getOnlineTime(req, res) {
        try {
            const { idUsuarios } = req.user;
            const { periodo } = req.query; // diario, mensual, anual

            const data = await estadisticasService.obtenerTiempoEnLinea(idUsuarios, periodo);
            res.json(data);
        } catch (error) {
            console.error("Error en getOnlineTime:", error);
            res.status(500).json({ message: "Error al obtener tiempo en línea" });
        }
    }
}

module.exports = new EstadisticasController();
