const express = require('express');
const router = express.Router();
const viajesController = require('../CONTROLLERS/ViajesController');
const verificarToken = require('../MIDDLEWARE/authmiddleware');
const authorize = require('../MIDDLEWARE/role.middleware');

router.use(verificarToken);

// Publicar viaje: Conductor
router.post('/', authorize(['CONDUCTOR', 'ADMIN']), viajesController.create);

// Buscar viajes: Público autenticado
router.get('/buscar', viajesController.search);

// Ver mis viajes (Conductor)
router.get('/mis-viajes', authorize(['CONDUCTOR']), viajesController.getMisViajes);

// Iniciar viaje
router.post('/:id/iniciar', authorize(['CONDUCTOR']), viajesController.iniciar);

// Finalizar viaje
router.post('/:id/finalizar', authorize(['CONDUCTOR']), viajesController.finalizar);

// Cancelar viaje
router.post('/:id/cancelar', authorize(['CONDUCTOR', 'ADMIN']), viajesController.cancelar);

// Ver detalle viaje
router.get('/:id', viajesController.getById);

// Estadísticas de viajes por día
router.get('/dia/:dia', authorize(['ADMIN']), viajesController.getViajesPorDia);

module.exports = router;
