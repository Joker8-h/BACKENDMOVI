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
    async register(data) {
        const { email, password, nombre, telefono, rol } = data;

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
        const newUsuario = await prisma.usuarios.create({
            data: {
                email,
                passwordHash,
                nombre,
                telefono,
                idRol: rolDb.idRol, // Usamos el ID del rol encontrado/creado
                estado: "ACTIVO",
            },
            include: {
                rol: true // Para devolver el nombre del rol
            }
        });

        // 5. Retornar sin password
        const { passwordHash: _, ...usuarioSinPassword } = newUsuario;
        return usuarioSinPassword;
    },

    async login(email, password) {
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

    async getAllUsers() {
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
    async getDrivers() {
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
    async getPassengers() {
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

    async updateUser(id, data) {
        const { password, ...updateData } = data; // Evitar actualizar password aquí directamente

       
        if (updateData.rol && typeof updateData.rol === 'string') {
            const rolDb = await prisma.roles.findUnique({ where: { nombre: updateData.rol } });
            if (rolDb) {
                updateData.idRol = rolDb.idRol;
            }
            delete updateData.rol; // Borramos el string para que no choque con prisma
        }

        const updatedUser = await prisma.usuarios.update({
            where: { idUsuarios: parseInt(id) },
            data: updateData,
            select: {
                idUsuarios: true,
                nombre: true,
                email: true,
                telefono: true,
                estado: true,
                rol: true
            }
        });
        return updatedUser;
    },

    async updateUserStatus(id, estado) {
        const updatedUser = await prisma.usuarios.update({
            where: { idUsuarios: parseInt(id) },
            data: { estado }, // El enum debe coincidir 'ACTIVO', 'INACTIVO', etc.
            select: {
                idUsuarios: true,
                nombre: true,
                estado: true
            }
        });
        return updatedUser;
    },

    async deleteUser(id) {
        const deletedUser = await prisma.usuarios.delete({
            where: { idUsuarios: parseInt(id) }
        });
        return deletedUser;
    },
};

module.exports = authService;
