const express = require('express');
const router = express.Router();
const { enviarContacto } = require('../CONTROLLERS/contactocontroller');

router.post('/', enviarContacto);

module.exports = router;