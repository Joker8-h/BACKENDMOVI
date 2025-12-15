const express = require('express');
const router = express.Router();
const viajeTramosController = require('../CONTROLLERS/ViajeTramosController');
const verificarToken = require('../MIDDLEWARE/authmiddleware');
const authorize = require('../MIDDLEWARE/role.middleware');

// Aplicar autenticación a todas las rutas
router.use(verificarToken);

// Rutas de consulta (todos los usuarios autenticados)
router.get('/viaje/:idViaje', viajeTramosController.getByViaje);
router.get('/:idViaje/:idParadaInicio/:idParadaFin', viajeTramosController.getTramo);

// Rutas para gestionar tramos (solo conductores)
router.post('/', authorize(['CONDUCTOR', 'ADMIN']), viajeTramosController.create);
router.post('/generar', authorize(['CONDUCTOR', 'ADMIN']), viajeTramosController.generarTramos);
router.put('/ocupacion', authorize(['CONDUCTOR', 'ADMIN']), viajeTramosController.updateOcupacion);

// Ruta para verificar disponibilidad (todos los usuarios autenticados)
router.post('/verificar-disponibilidad', viajeTramosController.verificarDisponibilidad);

module.exports = router;
