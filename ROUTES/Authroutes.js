const express = require('express');
const router = express.Router();
const verfificacion = require('../MIDDLEWARE/authmiddleware.js');
const authController = require('../CONTROLLERS/authcontroller.js');

router.post('/registro', authController.register);
router.post('/login', authController.login);

const authorize = require('../MIDDLEWARE/role.middleware.js');




router.get('/', verfificacion, authorize(['ADMIN']), authController.getUsuarios);
router.get('/conductores', verfificacion, authorize(['ADMIN']), authController.getConductores);
router.get('/pasajeros', verfificacion, authorize(['ADMIN']), authController.getPasajeros);

router.put('/:id', verfificacion, authorize(['ADMIN']), authController.updateUsuario);
router.patch('/:id/estado', verfificacion, authorize(['ADMIN']), authController.cambiarEstadoUsuario);
router.delete('/:id', verfificacion, authorize(['ADMIN']), authController.eliminarUsuario);

module.exports = router;