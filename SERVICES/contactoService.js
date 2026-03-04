const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

const enviarCorreoContacto = async ({ nombre, correo, tipo, mensaje }) => {

  await transporter.verify();

  const mailOptions = {
    from: `"Formulario Web" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: `Nuevo mensaje - ${tipo}`,
    html: `
      <h2>Nuevo mensaje desde la web</h2>
      <p><strong>Nombre:</strong> ${nombre}</p>
      <p><strong>Correo:</strong> ${correo}</p>
      <p><strong>Tipo:</strong> ${tipo}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${mensaje}</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  enviarCorreoContacto
};