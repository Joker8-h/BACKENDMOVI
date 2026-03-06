const estadisticasService = require('../SERVICES/EstadisticasService');

class EstadisticasController {
    async getGanancias(req, res) {
        try {
            const { id, rol } = req.user;
            const { periodo } = req.query; // diario, mensual, anual

            // Si es conductor o admin, ver ganancias
            if (rol.includes('CONDUCTOR') || rol.includes('ADMIN')) {
                const data = await estadisticasService.obtenerGananciasConductor(id, periodo);
                return res.json(data);
            }

            // Si es viajero/pasajero, ver gastos
            if (rol.includes('VIAJERO') || rol.includes('PASAJERO')) {
                const data = await estadisticasService.obtenerGastosPasajero(id, periodo);
                return res.json(data);
            }

            return res.status(403).json({ message: "No tienes permiso para ver estadísticas" });
        } catch (error) {
            console.error("Error en getGanancias:", error);
            res.status(500).json({ message: "Error al obtener estadísticas" });
        }
    }

    async getResumenViajes(req, res) {
        try {
            const { id, rol } = req.user;
            const data = await estadisticasService.obtenerResumenViajes(id, rol);
            res.json(data);
        } catch (error) {
            console.error("Error en getResumenViajes:", error);
            res.status(500).json({ message: "Error al obtener resumen de viajes" });
        }
    }

    async getMejoresRutas(req, res) {
        try {
            const { id, rol } = req.user;

            if (!rol.includes('CONDUCTOR') && !rol.includes('ADMIN')) {
                return res.status(403).json({ message: "No tienes permiso para ver mejores rutas" });
            }

            const data = await estadisticasService.obtenerMejoresRutas(id);
            res.json(data);
        } catch (error) {
            console.error("Error en getMejoresRutas:", error);
            res.status(500).json({ message: "Error al obtener mejores rutas" });
        }
    }

    async getOnlineTime(req, res) {
        try {
            const { id } = req.user;
            const { periodo } = req.query; // diario, mensual, anual

            const data = await estadisticasService.obtenerTiempoEnLinea(id, periodo);
            res.json(data);
        } catch (error) {
            console.error("Error en getOnlineTime:", error);
            res.status(500).json({ message: "Error al obtener tiempo en línea" });
        }
    }
}

module.exports = new EstadisticasController();
