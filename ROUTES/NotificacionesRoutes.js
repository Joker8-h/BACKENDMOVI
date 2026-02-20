const express = require('express');
const router = express.Router();
const notificacionesController = require('../CONTROLLERS/NotificacionesController');

// Crear una notificación (puede ser usada internamente o por admin)
router.post('/', notificacionesController.crear);

// Obtener todas las notificaciones de un usuario
router.get('/usuario/:idUsuario', notificacionesController.getPorUsuario);

// Obtener contador de no leídas
router.get('/usuario/:idUsuario/count', notificacionesController.getContadorNoLeidas);

// Marcar una como leída
router.patch('/:id/leida', notificacionesController.marcarLeida);

// Marcar todas las de un usuario como leídas
router.patch('/usuario/:idUsuario/leer-todas', notificacionesController.marcarTodasLeidas);

// Eliminar una notificación
router.delete('/:id', notificacionesController.eliminar);

module.exports = router;
