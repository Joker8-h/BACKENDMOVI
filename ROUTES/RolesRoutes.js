const express = require('express');
const router = express.Router();
const rolesController = require('../CONTROLLERS/RolesController');
const verificarToken = require('../MIDDLEWARE/authmiddleware');
const authorize = require('../MIDDLEWARE/role.middleware');

// Aplicar autenticación a todas las rutas
router.use(verificarToken);

// Rutas públicas para usuarios autenticados (listar roles)
router.get('/', rolesController.getAll);
router.get('/:id', rolesController.getById);

// Rutas protegidas (solo ADMIN)
router.post('/', authorize(['ADMIN']), rolesController.create);
router.put('/:id', authorize(['ADMIN']), rolesController.update);
router.delete('/:id', authorize(['ADMIN']), rolesController.delete);

module.exports = router;
