const express = require('express');
const router = express.Router();
const reservasController = require('../CONTROLLERS/ReservasController');
const verificarToken = require('../MIDDLEWARE/authmiddleware');
const authorize = require('../MIDDLEWARE/role.middleware');

router.use(verificarToken);

// Crear reserva: Pasajero (y Admin/Conductor si quieren viajar)
router.post('/', reservasController.create);

// Ver mis reservas
router.get('/mis-reservas', reservasController.getMisReservas);

// Ver detalle reserva (Por ID compuesto)
router.get('/:idUsuarios/:idViajes', reservasController.getById);

router.post('/:idViaje/cancelar', reservasController.cancelar);

module.exports = router;
