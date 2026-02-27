const documentacionService = require("../SERVICES/DocumentacionService");
const rutasService = require("../SERVICES/RutasService");

const rutasController = {
    async create(req, res) {
        try {
            const idUsuario = req.user.id;

            // Verificar estado de documentación
            const docs = await documentacionService.getByUsuarioId(idUsuario);
            if (docs && docs.estado === 'RECHAZADO') {
                return res.status(403).json({
                    error: "No puedes crear rutas. Tu documentación ha sido rechazada. Por favor, actualízala."
                });
            }

            const { preview, origin, destination, preference, k } = req.body;

            // Si es una previsualización (Optimización), devolvemos las opciones de Python
            if (preview && origin && destination) {
                const rutas = await rutasService.calcularRutasOptimas(origin, destination, preference, k);
                return res.json(rutas);
            }

            // De lo contrario, procedemos con la creación normal (Manual o Guardado de IA)
            const ruta = await rutasService.createRuta(req.body);
            res.json(ruta);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async addParada(req, res) {
        try {
            const { id } = req.params;
            const parada = await rutasService.addParada(id, req.body);
            res.json(parada);
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async getAll(req, res) {
        try {
            const rutas = await rutasService.getRutas();
            res.json(rutas);
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const ruta = await rutasService.getRutaById(id);
            if (!ruta) return res.json({ error: "Ruta no encontrada" });
            res.json(ruta);
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async getMisRutas(req, res) {
        try {
            const idUsuario = req.user.id;
            const rutas = await rutasService.getMisRutasFrecuentes(idUsuario);
            res.json(rutas);
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const ruta = await rutasService.updateRuta(id, req.body);
            res.json({ message: "Ruta actualizada", ruta });
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            await rutasService.deleteRuta(id);
            res.json({ message: "Ruta eliminada correctamente" });
        } catch (error) {
            res.json({ error: error.message });
        }
    },

};

module.exports = rutasController;
