const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const verfificacion = require('../MIDDLEWARE/authmiddleware.js');
const authController = require('../CONTROLLERS/authcontroller.js');

// Rate Limiting para Login (protección contra fuerza bruta)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20, // Solo 20 intentos de login por IP
    message: 'Demasiados intentos de inicio de sesión. Por favor intente más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/registro', authController.register);
router.post('/login', loginLimiter, authController.login);

const authorize = require('../MIDDLEWARE/role.middleware.js');




router.get('/', verfificacion, authorize(['ADMIN']), authController.getUsuarios);
router.get('/conductores', verfificacion, authorize(['ADMIN']), authController.getConductores);
router.get('/pasajeros', verfificacion, authorize(['ADMIN']), authController.getPasajeros);

router.put('/:id', verfificacion, authorize(['ADMIN', 'PASAJERO', 'CONDUCTOR']), authController.updateUsuario);
router.patch('/:id/estado', verfificacion, authorize(['ADMIN']), authController.cambiarEstadoUsuario);
router.delete('/:id', verfificacion, authorize(['ADMIN']), authController.eliminarUsuario);
router.get('/:id', verfificacion, authorize(['ADMIN', 'PASAJERO', 'CONDUCTOR']), authController.getUsuarioById);

router.get('/usuarios/dia/:dia', verfificacion, authorize(['ADMIN']), authController.getUsuariosPorDia);

module.exports = router;