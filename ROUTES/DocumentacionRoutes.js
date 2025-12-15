const express = require('express');
const router = express.Router();
const documentacionController = require('../CONTROLLERS/DocumentacionController');
const verificarToken = require('../MIDDLEWARE/authmiddleware');
const authorize = require('../MIDDLEWARE/role.middleware');

// Rutas para Conductor
router.post('/upload', verificarToken, authorize(['CONDUCTOR']), documentacionController.upload);
router.get('/me', verificarToken, authorize(['CONDUCTOR']), documentacionController.getMyDocs);

// Rutas para Admin (Validación)
router.patch('/validate/:id', verificarToken, authorize(['ADMIN']), documentacionController.validate);

module.exports = router;
