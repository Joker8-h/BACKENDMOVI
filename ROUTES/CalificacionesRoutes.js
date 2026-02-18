const express = require('express');
const router = express.Router();
const calificacionesController = require('../CONTROLLERS/CalificacionesController');
const verificarToken = require('../MIDDLEWARE/authmiddleware');

router.use(verificarToken);

router.post('/', calificacionesController.create);
router.get('/:idUsuario/promedio', calificacionesController.getPromedio);
router.get('/:id', calificacionesController.getById);

module.exports = router;
