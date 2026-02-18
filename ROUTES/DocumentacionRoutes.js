const express = require('express');
const router = express.Router();
const documentacionController = require('../CONTROLLERS/DocumentacionController');
const verificarToken = require('../MIDDLEWARE/authmiddleware');
const authorize = require('../MIDDLEWARE/role.middleware');

// Rutas para Conductor
router.post('/documentacion_subir', verificarToken, authorize(['CONDUCTOR']), documentacionController.upload);
router.get('/documentacion_mis', verificarToken, authorize(['CONDUCTOR']), documentacionController.getMyDocs);

// Rutas para Admin (Validación)
router.patch('/documentacion_validate/:id', verificarToken, authorize(['ADMIN']), documentacionController.validate);

// Ver detalle documentacion
router.get('/:id', verificarToken, authorize(['ADMIN']), documentacionController.getById);

module.exports = router;
