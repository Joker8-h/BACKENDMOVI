const vehiculosService = require("../SERVICES/VehiculosService");
const cloudinaryService = require("../SERVICES/CloudinaryService");
const aiService = require("../SERVICES/AiObjectRecognitionService");

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
            console.log("[VEHICULOS] Subiendo foto a Cloudinary...");
            const fotoUrl = await cloudinaryService.subirImagen(fotoVehiculo, "temp_plates");
            console.log("[VEHICULOS] Foto subida exitosamente:", fotoUrl);

            // 2. Analizar con IA
            console.log("[VEHICULOS] Llamando a aiService.verificarPlaca...");
            const result = await aiService.verificarPlaca(fotoUrl);
            console.log("[VEHICULOS] Resultado de la IA:", result);

            res.json({
                plate_text: result.plate_text,
                is_detected: result.is_detected,
                fotoUrl: fotoUrl
            });
        } catch (error) {
            console.error("[VEHICULOS] Error al extraer placa:", error);
            res.status(500).json({
                error: "Error al procesar la imagen de la placa",
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    },

    // Solicitud de cambio de vehículo (Conductor)
    async solicitarCambio(req, res) {
        try {
            const { id } = req.params;
            const { marca, modelo, placa, capacidad, fotoPlacaNueva } = req.body;

            let fotoPlacaNuevaUrl = null;
            if (fotoPlacaNueva) {
                try {
                    fotoPlacaNuevaUrl = await cloudinaryService.subirImagen(fotoPlacaNueva, "solicitudes_cambio");
                } catch (err) {
                    console.error("[VEHICULOS] Error al subir foto de placa a Cloudinary:", err.message);
                }
            }

            const solicitud = await vehiculosService.crearSolicitudCambio(id, {
                marca, modelo, placa, capacidad, fotoPlacaNuevaUrl
            });

            // Notificar a los administradores
            const socketService = require("../SERVICES/SocketService");
            socketService.notifyAdmins(
                "new_vehicle_change_request",
                {
                    idSolicitud: solicitud.idSolicitud,
                    conductor: req.user.nombre,
                    fecha: solicitud.fechaSolicitud
                },
                "Solicitud de Cambio de Vehículo",
                `El conductor ${req.user.nombre} ha solicitado modificar los datos de su vehículo.`
            );

            res.json({ mensaje: "Solicitud de cambio enviada para aprobación del administrador", solicitud });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Ver todas las solicitudes (Admin)
    async getSolicitudesCambio(req, res) {
        try {
            const { estado } = req.query;
            const solicitudes = await vehiculosService.getSolicitudesCambio(estado);
            res.json(solicitudes);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Aprobar/Rechazar solicitud (Admin)
    async procesarSolicitud(req, res) {
        try {
            const { id } = req.params;
            const { aprobado, observaciones } = req.body;
            const resultado = await vehiculosService.procesarSolicitudCambio(id, aprobado, observaciones);
            res.json({ mensaje: `Solicitud ${aprobado ? 'aprobada' : 'rechazada'} correctamente`, resultado });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = vehiculosController;
