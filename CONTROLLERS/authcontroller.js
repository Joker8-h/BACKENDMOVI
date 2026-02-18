const authService = require("../SERVICES/auth.service.js");
const reconocimientoService = require("../SERVICES/ReconocimientoService.js");
const cloudinaryService = require("../SERVICES/CloudinaryService.js");

const authController = {
    async register(req, res) {
        try {
            const { email, password, nombre, telefono, rol, image, faceImageUrl } = req.body;

            if (!email || !password || !nombre) {
                return res.status(400).json({ error: "Faltan campos obligatorios: email, password y nombre son requeridos" });
            }

            let imageUrl = faceImageUrl;

            if (!imageUrl && image) {
                try {
                    imageUrl = await cloudinaryService.subirImagen(image);
                } catch (cloudError) {
                    console.error("Error al subir foto:", cloudError.message);
                }
            }

            if (imageUrl) {
                try {
                    const fotosExistentes = await authService.obtenerTodasLasFotos();
                    if (fotosExistentes.length > 0) {
                        const duplicateCheck = await reconocimientoService.detectarDuplicado(imageUrl, fotosExistentes);
                        if (duplicateCheck.matchFound) {
                            return res.status(400).json({
                                error: "Este rostro ya está registrado con otra cuenta. No se permiten registros duplicados."
                            });
                        }
                    }
                } catch (dupError) {
                    console.error("Error al verificar duplicados:", dupError.message);
                }
            }

            const usuario = await authService.registrar({
                email,
                password,
                nombre,
                telefono,
                rol,
                fotoPerfil: imageUrl || null
            });

            res.json({
                mensaje: "Registro exitoso",
                usuario,
                fotoUrl: imageUrl || null
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async login(req, res) {
        try {
            const { email, password, image, faceImageUrl, nombre } = req.body;

            if (image || faceImageUrl) {
                let imageUrlActual = faceImageUrl;

                if (!imageUrlActual && image) {
                    imageUrlActual = await cloudinaryService.subirImagen(image, "temp_login");
                }

                let usuarioEncontrado = null;

                if (email || nombre) {
                    usuarioEncontrado = await authService.buscarPorEmailONombre(email, nombre);
                    if (!usuarioEncontrado) return res.status(404).json({ error: "Usuario no encontrado" });
                    if (!usuarioEncontrado.fotoPerfil) return res.status(400).json({ error: "Este usuario no tiene foto de perfil registrada" });

                    const resultado = await reconocimientoService.compararRostros(usuarioEncontrado.fotoPerfil, imageUrlActual);
                    if (!resultado.match) return res.status(401).json({ error: "Rostro no reconocido" });
                } else {
                    const fotosExistentes = await authService.obtenerTodasLasFotos();
                    if (fotosExistentes.length === 0) return res.status(400).json({ error: "No hay rostros registrados en el sistema" });

                    const searchResult = await reconocimientoService.detectarDuplicado(imageUrlActual, fotosExistentes);
                    if (!searchResult.matchFound) return res.status(401).json({ error: "Rostro no reconocido en el sistema" });

                    usuarioEncontrado = await authService.buscarPorFoto(searchResult.matchedUrl);
                    if (!usuarioEncontrado) return res.status(404).json({ error: "No se encontró el usuario para este rostro" });
                }

                const tokenData = await authService.loginFacial(usuarioEncontrado.idUsuarios);
                return res.json({
                    mensaje: "Inicio de sesión facial exitoso",
                    usuario: tokenData.usuario,
                    token: tokenData.token
                });
            }

            if (!email || !password) {
                return res.status(400).json({ error: "Email y contraseña son obligatorios" });
            }

            const resultado = await authService.iniciarSesion(email, password);
            if (!resultado) return res.status(401).json({ error: "Credenciales inválidas" });

            return res.json({
                mensaje: "Inicio de sesión exitoso",
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
    },

    async getUsuarioById(req, res) {
        try {
            const { id } = req.params;
            const user = await authService.obtenerUsuarioPorId(id);
            if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

}
module.exports = authController;
