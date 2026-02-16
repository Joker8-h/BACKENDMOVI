const express = require('express');
const router = express.Router();
const rutasController = require('../CONTROLLERS/RutasController');
const verificarToken = require('../MIDDLEWARE/authmiddleware');
const authorize = require('../MIDDLEWARE/role.middleware');

router.use(verificarToken);

// Crear ruta: ADMIN y CONDUCTOR
router.post('/', authorize(['ADMIN', 'CONDUCTOR']), rutasController.create);

// Agregar parada a ruta: ADMIN y CONDUCTOR
router.post('/:id/paradas', authorize(['ADMIN', 'CONDUCTOR', 'PASAJERO']), rutasController.addParada);

// Listar rutas: Público (Autenticado)
router.get('/', rutasController.getAll);

// Mis Rutas Frecuentes (Conductor)
router.get('/mis-rutas', authorize(['CONDUCTOR']), rutasController.getMisRutas);

// Ver detalle ruta
router.get('/:id', rutasController.getById);

// Actualizar ruta
router.put('/:id', authorize(['ADMIN', 'CONDUCTOR']), rutasController.update);

// Eliminar ruta
router.delete('/:id', authorize(['ADMIN', 'CONDUCTOR']), rutasController.delete);

module.exports = router;
