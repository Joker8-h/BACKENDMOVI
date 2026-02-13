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

// Eliminar vehículo
router.delete('/:id', authorize(['CONDUCTOR', 'ADMIN']), vehiculosController.delete);

// Activar/Desactivar vehículo
router.patch('/:id/estado', authorize(['CONDUCTOR', 'ADMIN']), vehiculosController.cambiarEstado);

module.exports = router;
