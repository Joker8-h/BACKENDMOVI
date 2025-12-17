/**
 * Middleware de autorización basado en roles
 * @param {Array<string>} allowedRoles - Array de roles permitidos (ej: ['ADMIN', 'CONDUCTOR'])
 * @returns {Function} Middleware function
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {

    // 🔴 CAMBIO CLAVE AQUÍ
    if (!req.usuario) {
      return res.status(401).json({
        error: "No autorizado. Token no proporcionado o inválido."
      });
    }

    // Si no se especifican roles, solo requiere autenticación
    if (allowedRoles.length === 0) {
      return next();
    }

    const normalizedAllowedRoles = allowedRoles.map(role => role.toUpperCase());
    const userRole = req.usuario.rol
      ? req.usuario.rol.toUpperCase()
      : null;

    if (!userRole) {
      return res.status(403).json({
        error: "Usuario sin rol asignado. Por favor contacte al administrador."
      });
    }

    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: "Acceso prohibido. No tienes el rol necesario.",
        details: {
          yourRole: req.usuario.rol,
          requiredRoles: allowedRoles
        }
      });
    }

    next();
  };
};

module.exports = authorize;
