const express = require('express');
const router = express.Router();
const planesConductorController = require('../CONTROLLERS/PlanesConductorController');
const verificarToken = require('../MIDDLEWARE/authmiddleware');
const authorize = require('../MIDDLEWARE/role.middleware');

// Rutas públicas (sin autenticación - para mostrar planes disponibles)
router.get('/activos', planesConductorController.getActivos);
router.get('/:id', planesConductorController.getById);

// Rutas protegidas (requieren autenticación)
router.use(verificarToken);

// Rutas de administración (solo ADMIN)
router.get('/', authorize(['ADMIN']), planesConductorController.getAll);
router.post('/', authorize(['ADMIN']), planesConductorController.create);
router.put('/:id', authorize(['ADMIN']), planesConductorController.update);
router.delete('/:id', authorize(['ADMIN']), planesConductorController.delete);

module.exports = router;
