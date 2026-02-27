const vehiculosService = require("../SERVICES/VehiculosService");
const cloudinaryService = require("../SERVICES/CloudinaryService");

const vehiculosController = {
    async create(req, res) {
        try {
            const { marca, modelo, placa, capacidad, fotoVehiculo } = req.body;

            const idUsuario = req.user.id;

            let fotoVehiculoUrl = null;
            if (fotoVehiculo) {
                try {
                    fotoVehiculoUrl = await cloudinaryService.subirImagen(fotoVehiculo, "vehiculos");
                } catch (err) {
                    console.error("[VEHICULOS] Error al subir foto a Cloudinary:", err.message);
                }
            }

            const nuevoVehiculo = await vehiculosService.create({
                idUsuario,
                marca,
                modelo,
                placa,
                capacidad: parseInt(capacidad),
                fotoVehiculo: fotoVehiculoUrl
            });
            res.json(nuevoVehiculo);
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async getMyVehiculos(req, res) {
        try {
            const idUsuario = req.user.id;
            const vehiculos = await vehiculosService.findByUser(idUsuario);
            res.json(vehiculos);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getAll(req, res) {
        try {
            const vehiculos = await vehiculosService.findAll();
            res.json(vehiculos);
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            const idUsuario = req.user.id;
            const userRole = req.user.rol;
            const physical = req.query.physical === 'true';

            await vehiculosService.delete(id, idUsuario, userRole, physical);
            res.json({ message: `Vehículo ${physical ? 'eliminado permanentemente' : 'desactivado'} correctamente` });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const { estado } = req.body;
            const idUsuario = req.user.id;

            const vehiculoActualizado = await vehiculosService.actualizarEstado(id, idUsuario, estado);
            res.json({ mensaje: `Vehículo ${estado.toLowerCase()} correctamente`, vehiculo: vehiculoActualizado });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const vehiculo = await vehiculosService.getById(id);
            if (!vehiculo) return res.status(404).json({ error: "Vehículo no encontrado" });
            res.json(vehiculo);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async validarPlacaAdmin(req, res) {
        try {
            const { id } = req.params;
            const { validada } = req.body;

            const vehiculo = await vehiculosService.validarPlacaManual(id, validada);
            res.json({ mensaje: "Estado de placa actualizado", vehiculo });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async extraerPlaca(req, res) {
        try {
            const { fotoVehiculo } = req.body;
            if (!fotoVehiculo) return res.status(400).json({ error: "Falta la foto del vehículo" });

            // 1. Subir a Cloudinary temporalmente o usar una carpeta específica
            const fotoUrl = await cloudinaryService.subirImagen(fotoVehiculo, "temp_plates");

            // 2. Analizar con IA
            const result = await aiService.verificarPlaca(fotoUrl);

            res.json({
                plate_text: result.plate_text,
                is_detected: result.is_detected,
                fotoUrl: fotoUrl
            });
        } catch (error) {
            console.error("[VEHICULOS] Error al extraer placa:", error.message);
            res.status(500).json({ error: "Error al procesar la imagen de la placa" });
        }
    }
};

module.exports = vehiculosController;
