const nodemailer = require('nodemailer');

const enviarCorreoContacto = async ({ nombre, correo, tipo, mensaje }) => {

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'somosmoviflex@gmail.com',
    subject: `Nuevo mensaje - ${tipo}`,
    html: `
      <h3>Nuevo mensaje desde MoviFlex</h3>
      <p><strong>Nombre:</strong> ${nombre}</p>
      <p><strong>Correo:</strong> ${correo}</p>
      <p><strong>Tipo:</strong> ${tipo}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${mensaje}</p>
    `
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = {
  enviarCorreoContacto
};