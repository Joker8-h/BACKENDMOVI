const express = require('express');
const router = express.Router();
const vehiculosController = require('../CONTROLLERS/VehiculosController');
const verificarToken = require('../MIDDLEWARE/authmiddleware');
const authorize = require('../MIDDLEWARE/role.middleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Crear vehículo: Solo Conductores y Admin
router.post('/', authorize(['CONDUCTOR', 'ADMIN']), vehiculosController.create);

// Ver mis vehículos: Solo Conductores
router.get('/mis-vehiculos', authorize(['CONDUCTOR']), vehiculosController.getMyVehiculos);

// Ver todos los vehículos: Solo Admin
router.get('/', authorize(['ADMIN']), vehiculosController.getAll);

// Ver detalle vehículo: Admin y Conductor
router.get('/:id', authorize(['CONDUCTOR', 'ADMIN']), vehiculosController.getById);

// Eliminar vehículo
router.delete('/:id', authorize(['CONDUCTOR', 'ADMIN']), vehiculosController.delete);

// Activar/Desactivar vehículo
router.patch('/:id/estado', authorize(['CONDUCTOR', 'ADMIN']), vehiculosController.cambiarEstado);

// Validar placa (Admin)
router.patch('/:id/validar-placa', authorize(['ADMIN']), vehiculosController.validarPlacaAdmin);

// Extraer placa de foto (Solo conductores y Admin)
router.post('/extraer-placa', authorize(['CONDUCTOR', 'ADMIN']), vehiculosController.extraerPlaca);

// --- FLUJO DE APROBACIÓN DE CAMBIOS ---

// Solicitar cambio de vehículo: Solo Conductores
router.post('/:id/solicitar-cambio', authorize(['CONDUCTOR']), vehiculosController.solicitarCambio);

// Ver solicitudes de cambio: Solo Admin
router.get('/solicitudes/pendientes', authorize(['ADMIN']), vehiculosController.getSolicitudesCambio);

// Procesar solicitud de cambio: Solo Admin
router.patch('/solicitudes/:id/procesar', authorize(['ADMIN']), vehiculosController.procesarSolicitud);

module.exports = router;
