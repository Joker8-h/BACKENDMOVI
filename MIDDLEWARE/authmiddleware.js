
require('dotenv').config();

const jwt = require('jsonwebtoken');

// Obtener la clave secreta
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error(
    "ERROR CRÍTICO: La variable de entorno JWT_SECRET no está definida."
  );
}

function verificarToken(req, res, next) {
  // 1. Obtener header Authorization
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      mensaje: "Acceso denegado. No se encontró el token de autorización."
    });
  }

  // 2. Validar formato Bearer <token>
  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      mensaje: "Formato de token inválido. Use: Bearer <token>"
    });
  }

  const token = parts[1];

  // 3. Verificar configuración
  if (!JWT_SECRET) {
    return res.status(500).json({
      mensaje: "Error interno de configuración de seguridad."
    });
  }

  // 4. Verificar token
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      let mensajeError = "Token inválido.";

      if (err.name === "TokenExpiredError") {
        mensajeError = "Token expirado. Inicie sesión nuevamente.";
      }

      return res.status(403).json({
        mensaje: mensajeError,
        error: err.name
      });
    }

    // 5. NORMALIZAR el usuario (CLAVE)
    req.usuario = {
      idUsuarios: decoded.idUsuarios ?? decoded.id,
      email: decoded.email,
      rol: decoded.rol
    };

    if (!req.usuario.idUsuarios) {
      return res.status(401).json({
        mensaje: "Token inválido: id de usuario no encontrado."
      });
    }

    // 6. Continuar
    next();
  });
}

module.exports = verificarToken;
