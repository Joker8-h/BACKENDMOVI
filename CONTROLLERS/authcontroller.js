const authService = require("../SERVICES/auth.service.js");
const reconocimientoService = require("../SERVICES/ReconocimientoService.js");

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

    async registroFacial(req, res) {
        try {
            const { email, password, nombre, telefono, rol, image } = req.body;

            if (!image) {
                return res.status(400).json({ error: "La imagen facial es requerida" });
            }

            // 1. Registrar usuario en la base de datos local
            const usuario = await authService.registrar({ email, password, nombre, telefono, rol });

            // 2. Registrar rostro en el servicio externo (usa el nombre como identificador)
            try {
                await reconocimientoService.registrarRostro(nombre, image);
            } catch (facialError) {
                // Si falla el facial, podrías optar por borrar el usuario o informar del error
                // Por ahora informamos, pero el usuario ya quedó creado en DB
                return res.status(207).json({
                    mensaje: "Usuario creado pero hubo un problema con el registro facial",
                    usuario,
                    facialError: facialError.message
                });
            }

            res.json({ mensaje: "Registro completo exitoso", usuario });
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

    async loginFacial(req, res) {
        try {
            const { image } = req.body;
            if (!image) {
                return res.status(400).json({ error: "Imagen requerida" });
            }

            // 1. Verificar rostro en el servicio externo
            const facialData = await reconocimientoService.verificarRostro(image);

            // 2. loginFacial en authService usando el ID retornado por el servicio facial
            // Nota: El servicio facial retorna user_id que debería coincidir con idUsuarios
            const resultado = await authService.loginFacial(facialData.user_id);

            res.json({
                mensaje: "Inicio de sesión facial exitoso",
                usuario: resultado.usuario,
                token: resultado.token
            });

        } catch (error) {
            res.status(401).json({ error: error.message });
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
