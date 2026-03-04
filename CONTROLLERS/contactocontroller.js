const { enviarCorreoContacto } = require('../SERVICES/contactoService');

const enviarContacto = async (req, res) => {
  try {
    const { nombre, correo, tipo, mensaje } = req.body;

    if (!nombre || !correo || !tipo || !mensaje) {
      return res.status(400).json({
        mensaje: 'Todos los campos son obligatorios'
      });
    }

    await enviarCorreoContacto({ nombre, correo, tipo, mensaje });

    res.status(200).json({
      mensaje: 'Mensaje enviado correctamente'
    });

  } catch (error) {
    console.error('Error en contacto:', error);
    res.status(500).json({
      mensaje: 'Error al enviar el mensaje'
    });
  }
};

module.exports = {
  enviarContacto
};