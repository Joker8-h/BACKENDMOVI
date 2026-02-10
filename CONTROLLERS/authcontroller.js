const authService = require("../SERVICES/auth.service.js");

const authController = {
    async register(req, res) {
        try {
            const { email, password, nombre, telefono, rol } = req.body;

            if (!email || !password || !nombre) {
                return res.status(400).json({ error: "Faltan campos obligatorios: email, password y nombre son requeridos" });
            }

            const usuario = await authService.registrar({ email, password, nombre, telefono, rol });
            res.json(usuario);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
    async login(req, res) {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.json({ error: "Todos los campos son obligatorios" });
        }
        try {
            const resultado = await authService.iniciarSesion(email, password);
            if (!resultado) {
                return res.json({ error: "Credenciales inválidas" });
            } else {
                return res.json({
                    mensaje: "Inicio de sesión exitoso",
                    usuario: resultado.usuario,
                    token: resultado.token
                });
            }

        } catch (error) {
            res.json({ error: error.message });
        }
    },

    // --- Admin CRUD Controllers ---

    async getUsuarios(req, res) {
        try {
            const users = await authService.obtenerTodosUsuarios();
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getConductores(req, res) {
        try {
            const drivers = await authService.obtenerConductores();
            res.json(drivers);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getPasajeros(req, res) {
        try {
            const passengers = await authService.obtenerPasajeros();
            res.json(passengers);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async updateUsuario(req, res) {
        try {
            const { id } = req.params;
            const updatedUser = await authService.actualizarUsuario(id, req.body);
            res.json({ mensaje: "Usuario actualizado", usuario: updatedUser });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async cambiarEstadoUsuario(req, res) {
        try {
            const { id } = req.params;
            const { estado } = req.body;
            if (!['ACTIVO', 'INACTIVO', 'SUSPENDIDO'].includes(estado)) {
                return res.status(400).json({ error: "Estado no válido" });
            }
            const updatedUser = await authService.actualizarEstadoUsuario(id, estado);
            res.json({ mensaje: "Estado actualizado", usuario: updatedUser });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async eliminarUsuario(req, res) {
        try {
            const { id } = req.params;
            await authService.eliminarUsuario(id);
            res.json({ mensaje: "Usuario eliminado correctamente" });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async getUsuariosPorDia(req, res) {
        try {
            const { dia } = req.params;
            const users = await authService.obtenerUsuariosPorDiaSemana(dia);
            res.json(users);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

}
module.exports = authController;
