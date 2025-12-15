const rolesService = require("../SERVICES/RolesService");

const rolesController = {
    // Listar todos los roles
    async getAll(req, res) {
        try {
            const roles = await rolesService.getAllRoles();
            res.json(roles);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Obtener rol por ID
    async getById(req, res) {
        try {
            const { id } = req.params;
            const rol = await rolesService.getRoleById(id);

            if (!rol) {
                return res.status(404).json({ error: "Rol no encontrado" });
            }

            res.json(rol);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Crear nuevo rol
    async create(req, res) {
        try {
            const rol = await rolesService.createRole(req.body);
            res.status(201).json({
                message: "Rol creado exitosamente",
                rol
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Actualizar rol
    async update(req, res) {
        try {
            const { id } = req.params;
            const rol = await rolesService.updateRole(id, req.body);
            res.json({
                message: "Rol actualizado exitosamente",
                rol
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Eliminar rol
    async delete(req, res) {
        try {
            const { id } = req.params;
            await rolesService.deleteRole(id);
            res.json({ message: "Rol eliminado exitosamente" });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = rolesController;
