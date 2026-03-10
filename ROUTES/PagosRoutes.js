const express = require('express');
const router = express.Router();
const pagosController = require('../CONTROLLERS/PagosController');
const verificarToken = require('../MIDDLEWARE/authmiddleware');

router.use(verificarToken);

router.post('/', pagosController.create);
router.get('/', pagosController.getMyPagos);
router.get('/viaje/:idViaje', pagosController.getByViaje);
router.get('/viaje/:idViaje/usuario/:idUsuario', pagosController.getByViajeAndUser);
router.get('/:id', pagosController.getById);
router.patch('/:id/confirmacion', pagosController.updateConfirmacion);

module.exports = router;
