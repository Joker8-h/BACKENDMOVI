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

            // 1. Subir imagen a Cloudinary
            let imageUrl;
            try {
                console.log("AuthController: Llamando a CloudinaryService...");
                imageUrl = await cloudinaryService.subirImagen(image);
                console.log("AuthController: URL obtenida de Cloudinary:", imageUrl);
            } catch (cloudError) {
                console.error("AuthController: Error en subida a Cloudinary:", cloudError.message);
                return res.status(500).json({ error: "Error al subir la imagen a la nube: " + cloudError.message });
            }

            // 2. Registrar usuario en la base de datos con la URL de la foto
            console.log("AuthController: Registrando usuario en DB con foto...");
            const usuario = await authService.registrar({ email, password, nombre, telefono, rol, fotoPerfil: imageUrl });
            console.log("AuthController: Usuario registrado con ID:", usuario.idUsuarios);

            console.log("AuthController: Registro facial completo.");
            res.json({ mensaje: "Registro exitoso", usuario, imageUrl });
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
            const { image, email, nombre } = req.body;

            if (!image) {
                return res.status(400).json({ error: "Imagen requerida" });
            }

            if (!email && !nombre) {
                return res.status(400).json({ error: "Debe proporcionar email o nombre para el login facial" });
            }

            // 1. Buscar usuario en la base de datos
            console.log("AuthController: Buscando usuario para login facial...");
            const usuario = await authService.buscarPorEmailONombre(email, nombre);

            if (!usuario) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            if (!usuario.fotoPerfil) {
                return res.status(400).json({ error: "Este usuario no tiene foto de perfil registrada" });
            }

            console.log("AuthController: Usuario encontrado:", usuario.nombre);
            console.log("AuthController: Foto almacenada:", usuario.fotoPerfil);

            // 2. Subir imagen actual a Cloudinary (temporal)
            console.log("AuthController: Subiendo imagen de login a Cloudinary...");
            const imageUrlActual = await cloudinaryService.subirImagen(image, "temp_login");
            console.log("AuthController: URL de imagen actual:", imageUrlActual);

            // 3. Comparar rostros usando Python
            console.log("AuthController: Comparando rostros...");
            const resultado = await reconocimientoService.compararRostros(usuario.fotoPerfil, imageUrlActual);

            if (!resultado.match) {
                console.log("AuthController: Rostros no coinciden. Distance:", resultado.distance);
                return res.status(401).json({ error: "Rostro no reconocido" });
            }

            console.log("AuthController: Rostros coinciden! Generando token...");

            // 4. Generar token de sesión usando el ID del usuario
            const tokenData = await authService.loginFacial(usuario.idUsuarios);

            res.json({
                mensaje: "Inicio de sesión facial exitoso",
                usuario: tokenData.usuario,
                token: tokenData.token,
                matchDistance: resultado.distance
            });

        } catch (error) {
            console.error("AuthController: Error en login facial:", error.message);
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
