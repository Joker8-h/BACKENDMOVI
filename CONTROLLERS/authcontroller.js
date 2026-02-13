const authService = require("../SERVICES/auth.service.js");
const reconocimientoService = require("../SERVICES/ReconocimientoService.js");
const cloudinaryService = require("../SERVICES/CloudinaryService.js");

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
            console.log("AuthController: Iniciando registro facial para:", email);

            if (!image) {
                return res.status(400).json({ error: "La imagen facial es requerida" });
            }

            // 1. Subir imagen a Cloudinary desde el Backend (Node)
            let imageUrl;
            try {
                console.log("AuthController: Llamando a CloudinaryService...");
                imageUrl = await cloudinaryService.subirImagen(image);
                console.log("AuthController: URL obtenida de Cloudinary:", imageUrl);
            } catch (cloudError) {
                console.error("AuthController: Error en subida a Cloudinary:", cloudError.message);
                return res.status(500).json({ error: "Error al subir la imagen a la nube: " + cloudError.message });
            }

            // 2. Registrar usuario en la base de datos local
            console.log("AuthController: Registrando usuario en DB local...");
            const usuario = await authService.registrar({ email, password, nombre, telefono, rol, fotoPerfil: imageUrl });
            console.log("AuthController: Usuario registrado con ID:", usuario.idUsuarios);

            // 3. Registrar rostro en el servicio externo (enviando la URL de Cloudinary)
            try {
                console.log("AuthController: Llamando a ReconocimientoService (Python)...");
                await reconocimientoService.registrarRostro(nombre, null, imageUrl);
                console.log("AuthController: Rostro registrado en Python exitosamente.");
            } catch (facialError) {
                console.error("AuthController: Error en registro facial (Python):", facialError.message);
                // Si falla el facial, informamos (el usuario ya queda creado en DB)
                return res.status(207).json({
                    mensaje: "Usuario creado pero hubo un problema con el registro facial",
                    usuario,
                    imageUrl,
                    facialError: facialError.message
                });
            }

            console.log("AuthController: Registro facial completo.");
            res.json({ mensaje: "Registro completo exitoso", usuario, imageUrl });
        } catch (error) {
            console.error("AuthController: Error general en registro facial:", error.message);
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

            // 1. Verificar rostro en el servicio externo (podemos enviar base64 directamente o subir a Cloudinary temporalmente)
            // Para login, a veces es más rápido enviar base64 si no queremos guardar la foto de cada login.
            // Pero si el servicio de Python descarga de Cloudinary, es mejor subirla.
            const imageUrl = await cloudinaryService.subirImagen(image, "temp_login");

            const facialData = await reconocimientoService.verificarRostro(null, imageUrl);

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
