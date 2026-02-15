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

            console.log("AuthController: Registro para:", email, "| Con foto:", !!(image || faceImageUrl));

            // Manejo OPCIONAL de foto facial
            let imageUrl = faceImageUrl;

            // Si hay image (base64) pero no faceImageUrl, subir a Cloudinary
            if (!imageUrl && image) {
                try {
                    console.log("AuthController: Subiendo imagen a Cloudinary...");
                    imageUrl = await cloudinaryService.subirImagen(image);
                    console.log("AuthController: URL de foto obtenida:", imageUrl);
                } catch (cloudError) {
                    console.error("AuthController: Error al subir foto (no crítico):", cloudError.message);
                    // No fallar el registro si falla la foto
                }
            } else if (imageUrl) {
                console.log("AuthController: Usando URL de foto proporcionada:", imageUrl);
            }

            // --- NUEVO: Detección de duplicados faciales ---
            if (imageUrl) {
                try {
                    console.log("AuthController: Buscando duplicados para la nueva foto...");
                    const fotosExistentes = await authService.obtenerTodasLasFotos();

                    if (fotosExistentes.length > 0) {
                        const duplicateCheck = await reconocimientoService.detectarDuplicado(imageUrl, fotosExistentes);

                        if (duplicateCheck.matchFound) {
                            console.log("AuthController: ¡Rostro duplicado detectado!");
                            return res.status(400).json({
                                error: "Este rostro ya está registrado con otra cuenta. No se permiten registros duplicados."
                            });
                        }
                    }
                } catch (dupError) {
                    console.error("AuthController: Error al verificar duplicados (no bloqueante):", dupError.message);
                    // Decidimos si bloquear o no el registro si el servicio de Python falla. 
                    // Por ahora, dejamos que continúe para no afectar la disponibilidad.
                }
            }
            // ----------------------------------------------

            // Registrar usuario (con o sin foto)
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
            console.error("AuthController: Error en registro:", error.message);
            res.status(400).json({ error: error.message });
        }
    },

    async login(req, res) {
        try {
            const { email, password, image, faceImageUrl, nombre } = req.body;

            // Si hay imagen → Login Facial
            if (image || faceImageUrl) {
                console.log("AuthController: Login FACIAL para:", email || nombre);

                if (!email && !nombre) {
                    return res.status(400).json({ error: "Debe proporcionar email o nombre para el login facial" });
                }

                // 1. Buscar usuario en la base de datos
                const usuario = await authService.buscarPorEmailONombre(email, nombre);

                if (!usuario) {
                    return res.status(404).json({ error: "Usuario no encontrado" });
                }

                if (!usuario.fotoPerfil) {
                    return res.status(400).json({ error: "Este usuario no tiene foto de perfil registrada" });
                }

                console.log("AuthController: Usuario encontrado:", usuario.nombre);
                console.log("AuthController: Foto almacenada:", usuario.fotoPerfil);

                // 2. Obtener URL de la imagen actual
                let imageUrlActual = faceImageUrl;
                if (!imageUrlActual && image) {
                    console.log("AuthController: Subiendo imagen de login a Cloudinary...");
                    imageUrlActual = await cloudinaryService.subirImagen(image, "temp_login");
                }
                console.log("AuthController: URL de imagen actual:", imageUrlActual);

                // 3. Comparar rostros usando Python
                console.log("AuthController: Comparando rostros...");
                const resultado = await reconocimientoService.compararRostros(usuario.fotoPerfil, imageUrlActual);

                if (!resultado.match) {
                    console.log("AuthController: Rostros no coinciden. Distance:", resultado.distance);
                    return res.status(401).json({ error: "Rostro no reconocido" });
                }

                console.log("AuthController: Rostros coinciden! Generando token...");
                const tokenData = await authService.loginFacial(usuario.idUsuarios);

                return res.json({
                    mensaje: "Inicio de sesión facial exitoso",
                    usuario: tokenData.usuario,
                    token: tokenData.token,
                    matchDistance: resultado.distance
                });
            }

            // Si NO hay imagen → Login Normal (email + password)
            console.log("AuthController: Login NORMAL para:", email);

            if (!email || !password) {
                return res.status(400).json({ error: "Email y contraseña son obligatorios" });
            }

            const resultado = await authService.iniciarSesion(email, password);
            if (!resultado) {
                return res.status(401).json({ error: "Credenciales inválidas" });
            }

            return res.json({
                mensaje: "Inicio de sesión exitoso",
                usuario: resultado.usuario,
                token: resultado.token
            });

        } catch (error) {
            console.error("AuthController: Error en login:", error.message);
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
