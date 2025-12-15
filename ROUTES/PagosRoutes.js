const express = require('express');
const router = express.Router();
const pagosController = require('../CONTROLLERS/PagosController');
const verificarToken = require('../MIDDLEWARE/authmiddleware');

router.use(verificarToken);

router.post('/', pagosController.create);
router.get('/', pagosController.getMyPagos);

module.exports = router;
