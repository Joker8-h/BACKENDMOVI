/**
 * Middleware de autorización basado en roles
 * @param {Array<string>} allowedRoles - Array de roles permitidos (ej: ['ADMIN', 'CONDUCTOR'])
 * @returns {Function} Middleware function
 */
const authorize = (allowedRoles = []) => {
    return (req, res, next) => {
        // Validar que el usuario esté autenticado
        if (!req.user) {
            return res.status(401).json({
                error: "No autorizado. Token no proporcionado o inválido."
            });
        }

        // Si no se especifican roles, solo requiere autenticación
        if (allowedRoles.length === 0) {
            return next();
        }

        // Normalizar roles a mayúsculas para comparación
        const normalizedAllowedRoles = allowedRoles.map(role => role.toUpperCase());
        const userRole = req.user.rol ? req.user.rol.toUpperCase() : null;

        // Validar que el usuario tenga un rol
        if (!userRole) {
            return res.status(403).json({
                error: "Usuario sin rol asignado. Por favor contacte al administrador."
            });
        }

        // Verificar si el rol del usuario está en los roles permitidos
        if (!normalizedAllowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: "Acceso prohibido. No tienes el rol necesario.",
                details: {
                    yourRole: req.user.rol,
                    requiredRoles: allowedRoles
                }
            });
        }

        // Usuario autorizado
        next();
    };
};

module.exports = authorize;

