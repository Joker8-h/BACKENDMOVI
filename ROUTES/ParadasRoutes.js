const express = require('express');
const router = express.Router();
const paradasController = require('../CONTROLLERS/ParadasController');
const verificarToken = require('../MIDDLEWARE/authmiddleware');
const authorize = require('../MIDDLEWARE/role.middleware');

// Aplicar autenticación a todas las rutas
router.use(verificarToken);

// Rutas públicas para usuarios autenticados
router.get('/', paradasController.getAll);
router.get('/ruta/:idRuta', paradasController.getByRuta);
router.get('/:id', paradasController.getById);

// Rutas protegidas (conductores/admin pueden gestionar paradas)
router.post('/', authorize(['CONDUCTOR', 'ADMIN', 'PASAJERO']), paradasController.create);
router.put('/:id', authorize(['CONDUCTOR', 'ADMIN', 'PASAJERO']), paradasController.update);
router.delete('/:id', authorize(['CONDUCTOR', 'ADMIN', 'PASAJERO']), paradasController.delete);

module.exports = router;
