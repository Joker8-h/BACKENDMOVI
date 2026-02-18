const express = require('express');
const router = express.Router();
const suscripcionesController = require('../CONTROLLERS/SuscripcionesController');
const verificarToken = require('../MIDDLEWARE/authmiddleware');
const authorize = require('../MIDDLEWARE/role.middleware');

router.use(verificarToken);

// Crear Plan: Solo Admin
router.post('/planes', authorize(['ADMIN']), suscripcionesController.createPlan);

// Ver planes: Público (o autenticado)
router.get('/planes', suscripcionesController.getPlanes);

// Suscribirse: Conductor
router.post('/suscribirse', authorize(['CONDUCTOR']), suscripcionesController.suscribirse);

// Ver mi suscripción
router.get('/mi-suscripcion', authorize(['CONDUCTOR']), suscripcionesController.getMiSuscripcion);

// Ver detalle de una suscripción
router.get('/:id', authorize(['CONDUCTOR', 'ADMIN']), suscripcionesController.getById);

module.exports = router;
