const viajesService = require("../SERVICES/ViajesService");
const documentacionService = require("../SERVICES/DocumentacionService");
const pricingService = require("../SERVICES/PricingService");

const viajesController = {
    async create(req, res) {
        try {
            const idUsuario = req.user.id;

            // Verificar estado de documentación
            const docs = await documentacionService.getByUsuarioId(idUsuario);
            if (docs && docs.estado === 'RECHAZADO') {
                return res.status(403).json({
                    error: "No puedes publicar viajes. Tu documentación ha sido rechazada. Por favor, actualízala."
                });
            }

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
            const rol = req.user.rol?.toUpperCase();

            let viajes;
            if (rol === 'CONDUCTOR') {
                viajes = await viajesService.getMisViajesConductor(idUsuario);
            } else if (rol === 'PASAJERO' || rol === 'VIAJERO') {
                viajes = await viajesService.getMisViajesPasajero(idUsuario);
            } else {
                // Para ADMIN o si no hay rol claro, intentamos traer ambos o conductor por defecto
                viajes = await viajesService.getMisViajesConductor(idUsuario);
            }

            res.json(viajes);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getViajesPorDia(req, res) {
        try {
            const { dia } = req.params;
            const viajes = await viajesService.obtenerViajesPorDiaSemana(dia);
            res.json(viajes);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async estimarPrecio(req, res) {
        try {
            const { id } = req.params;
            const { latSubida, lngSubida, latBajada, lngBajada, idParadaSubida, idParadaBajada } = req.query;
            const idUsuario = req.user?.id || 0;

            const estimacion = await pricingService.estimarPrecioTramo({
                idViaje: id,
                latSubida: parseFloat(latSubida),
                lngSubida: parseFloat(lngSubida),
                latBajada: parseFloat(latBajada),
                lngBajada: parseFloat(lngBajada),
                idParadaSubida: idParadaSubida ? parseInt(idParadaSubida) : null,
                idParadaBajada: idParadaBajada ? parseInt(idParadaBajada) : null,
                idUsuario
            });

            res.json(estimacion);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = viajesController;
