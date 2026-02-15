const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require('dotenv').config();

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "secreto_super_seguro";
const JWT_EXPIRES_IN = process.env.EXPIRE_TIME || "1d";

/**
 * Valida que la contraseña cumpla con requisitos de seguridad
 * @param {string} password - Contraseña a validar
 * @returns {object} - { isValid: boleano, errors: string[] }
 */
function validarPasswordSegura(password) {
    const errors = [];

    if (!password) {
        errors.push("La contraseña es requerida.");
        return { isValid: false, errors };
    }

    // Mínimo 8 caracteres
    if (password.length < 8) {
        errors.push("La contraseña debe tener al menos 8 caracteres.");
    }

    // Máximo 128 caracteres (para evitar ataques DoS)
    if (password.length > 128) {
        errors.push("La contraseña no puede tener más de 128 caracteres.");
    }

    // Al menos una letra mayúscula
    if (!/[A-Z]/.test(password)) {
        errors.push("La contraseña debe contener al menos una letra mayúscula.");
    }

    // Al menos una letra minúscula
    if (!/[a-z]/.test(password)) {
        errors.push("La contraseña debe contener al menos una letra minúscula.");
    }

    // Al menos un número
    if (!/[0-9]/.test(password)) {
        errors.push("La contraseña debe contener al menos un número.");
    }

    // Al menos un carácter especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push("La contraseña debe contener al menos un carácter especial (!@#$%^&*()_+-=[]{}|;':\",./<>?).");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

const authService = {
    async registrar(data) {
        const { email, password, nombre, telefono, rol, fotoPerfil } = data;

        console.log("DEBUG authService.registrar - fotoPerfil recibido:", fotoPerfil);
        console.log("DEBUG authService.registrar - Longitud de fotoPerfil:", fotoPerfil ? fotoPerfil.length : 0);

        // 1. Validar contraseña segura
        const validacionPassword = validarPasswordSegura(password);
        if (!validacionPassword.isValid) {
            throw new Error(`Contraseña no válida: ${validacionPassword.errors.join(" ")}`);
        }

        // 2. Verificar si el usuario ya existe
        const usuarioExiste = await prisma.usuarios.findUnique({
            where: { email },
        });

        if (usuarioExiste) {
            throw new Error("El usuario ya existe con ese correo electrónico.");
        }

        // 2. Resolver el Rol (String -> ID)

        let nombreRol = rol || "PASAJERO";
        let rolDb = await prisma.roles.findUnique({
            where: { nombre: nombreRol }
        });

        if (!rolDb) {
            // Crear el rol si no existe
            rolDb = await prisma.roles.create({
                data: { nombre: nombreRol }
            });
        }

        // 3. Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 4. Crear usuario
        console.log("DEBUG authService.registrar - Creando usuario con fotoPerfil:", fotoPerfil);
        const newUsuario = await prisma.usuarios.create({
            data: {
                email,
                passwordHash,
                nombre,
                telefono,
                fotoPerfil,
                idRol: rolDb.idRol, // Usamos el ID del rol encontrado/creado
                estado: "ACTIVO",
            },
            include: {
                rol: true // Para devolver el nombre del rol
            }
        });

        console.log("DEBUG authService.registrar - Usuario creado. fotoPerfil guardado:", newUsuario.fotoPerfil);

        // 5. Retornar sin password
        const { passwordHash: _, ...usuarioSinPassword } = newUsuario;
        return usuarioSinPassword;
    },

    async buscarPorEmailONombre(email, nombre) {
        let usuario = null;

        if (email) {
            usuario = await prisma.usuarios.findUnique({
                where: { email },
                include: { rol: true }
            });
        }

        if (!usuario && nombre) {
            usuario = await prisma.usuarios.findFirst({
                where: { nombre },
                include: { rol: true }
            });
        }

        if (!usuario) {
            return null;
        }

        const { passwordHash: _, ...usuarioSinPassword } = usuario;
        return usuarioSinPassword;
    },

    async iniciarSesion(email, password) {
        // Buscar usuario e incluir su Rol
        const usuario = await prisma.usuarios.findUnique({
            where: { email },
            include: { rol: true }
        });

        if (!usuario) {
            throw new Error("Credenciales inválidas.");
        }

        const passwordValida = await bcrypt.compare(
            password,
            usuario.passwordHash
        );

        if (!passwordValida) {
            throw new Error("Credenciales inválidas.");
        }

        if (usuario.estado !== "ACTIVO") {
            throw new Error("Usuario inactivo o suspendido.");
        }

        // Generar JWT
        const token = jwt.sign(
            {
                id: usuario.idUsuarios, // ID del usuario
                email: usuario.email,
                idRol: usuario.idRol,   // ID del rol (para middleware)
                rol: usuario.rol.nombre // Nombre del rol (para frontend)
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const { passwordHash: _, ...usuarioSinPassword } = usuario;

        return {
            usuario: usuarioSinPassword,
            token,
        };
    },

    async buscarPorNombre(nombre) {
        return await prisma.usuarios.findFirst({
            where: { nombre },
            include: { rol: true }
        });
    },

    async loginFacial(idUsuarios) {
        const usuario = await prisma.usuarios.findUnique({
            where: { idUsuarios: parseInt(idUsuarios) },
            include: { rol: true }
        });

        if (!usuario) {
            throw new Error("Usuario no encontrado.");
        }

        if (usuario.estado !== "ACTIVO") {
            throw new Error("Usuario inactivo o suspendido.");
        }

        const token = jwt.sign(
            {
                id: usuario.idUsuarios,
                email: usuario.email,
                idRol: usuario.idRol,
                rol: usuario.rol.nombre
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const { passwordHash: _, ...usuarioSinPassword } = usuario;

        return {
            usuario: usuarioSinPassword,
            token,
        };
    },

    async obtenerTodosUsuarios() {
        // Listar usuarios con el nombre de su rol
        const users = await prisma.usuarios.findMany({
            select: {
                idUsuarios: true,
                nombre: true,
                email: true,
                telefono: true,
                estado: true,
                creadoEn: true,
                rol: {
                    select: {
                        nombre: true,
                        idRol: true
                    }
                }
            },
            orderBy: {
                creadoEn: 'desc'
            }
        });
        return users;
    },

    /** Lista solo conductores (excluye ADMIN) */
    async obtenerConductores() {
        return await prisma.usuarios.findMany({
            where: {
                rol: { nombre: 'CONDUCTOR' }
            },
            select: {
                idUsuarios: true,
                nombre: true,
                email: true,
                telefono: true,
                estado: true,
                creadoEn: true,
                rol: {
                    select: {
                        nombre: true,
                        idRol: true
                    }
                }
            },
            orderBy: {
                creadoEn: 'desc'
            }
        });
    },

    /** Lista solo pasajeros (excluye CONDUCTOR y ADMIN) */
    async obtenerPasajeros() {
        return await prisma.usuarios.findMany({
            where: {
                rol: { nombre: 'PASAJERO' }
            },
            select: {
                idUsuarios: true,
                nombre: true,
                email: true,
                telefono: true,
                estado: true,
                creadoEn: true,
                rol: {
                    select: {
                        nombre: true,
                        idRol: true
                    }
                }
            },
            orderBy: {
                creadoEn: 'desc'
            }
        });
    },

    async actualizarUsuario(id, data) {
        const { password, ...datosActualizar } = data; // Evitar actualizar password aquí directamente


        if (datosActualizar.rol && typeof datosActualizar.rol === 'string') {
            const rolDb = await prisma.roles.findUnique({ where: { nombre: datosActualizar.rol } });
            if (rolDb) {
                datosActualizar.idRol = rolDb.idRol;
            }
            delete datosActualizar.rol; // Borramos el string para que no choque con prisma
        }

        const usuarioActualizado = await prisma.usuarios.update({
            where: { idUsuarios: parseInt(id) },
            data: datosActualizar,
            select: {
                idUsuarios: true,
                nombre: true,
                email: true,
                telefono: true,
                estado: true,
                rol: true
            }
        });
        return usuarioActualizado;
    },

    async actualizarEstadoUsuario(id, estado) {
        const usuarioActualizado = await prisma.usuarios.update({
            where: { idUsuarios: parseInt(id) },
            data: { estado }, // El enum debe coincidir 'ACTIVO', 'INACTIVO', etc.
            select: {
                idUsuarios: true,
                nombre: true,
                estado: true
            }
        });
        return usuarioActualizado;
    },

    async eliminarUsuario(id) {
        const usuarioEliminado = await prisma.usuarios.delete({
            where: { idUsuarios: parseInt(id) }
        });
        return usuarioEliminado;
    },

    async obtenerUsuariosPorDiaSemana(dia) {
        const diasMapa = {
            'lunes': 0,
            'martes': 1,
            'miercoles': 2,
            'jueves': 3,
            'viernes': 4,
            'sabado': 5,
            'domingo': 6
        };

        let diaNum;
        if (isNaN(dia)) {
            const diaNormalizado = dia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            diaNum = diasMapa[diaNormalizado];
        } else {
            diaNum = parseInt(dia);
        }

        if (diaNum === undefined || diaNum < 0 || diaNum > 6) {
            throw new Error("Día no válido. Use el nombre del día (ej. lunes) o un número del 0 (Lunes) al 6 (Domingo).");
        }

        // MySQL WEEKDAY() devuelve 0 para lunes, 1 para martes, ..., 6 para domingo
        const usuarios = await prisma.$queryRaw`
            SELECT u.idUsuarios, u.nombre, u.email, u.telefono, u.estado, u.creadoEn, r.nombre as rolNombre
            FROM Usuarios u
            JOIN Roles r ON u.idRol = r.idRol
            WHERE WEEKDAY(u.creadoEn) = ${diaNum}
        `;

        return usuarios;
    },

    async obtenerTodasLasFotos() {
        const usuarios = await prisma.usuarios.findMany({
            where: {
                fotoPerfil: { not: null }
            },
            select: {
                fotoPerfil: true
            }
        });
        return usuarios.map(u => u.fotoPerfil).filter(url => url !== null);
    },
};

module.exports = authService;
