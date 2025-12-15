const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require('dotenv').config();

const prisma = new PrismaClient({
    // eliminar accelerateUrl si no usas Prisma Accelerate, usar datasources si es necesario, 
    // o dejar default. Para mysql local suele ser suficiente vacío si .env está bien.
});

const JWT_SECRET = process.env.JWT_SECRET || "secreto_super_seguro"; // Fallback por seguridad dev
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

const authService = {
    async register(data) {
        const { email, password, nombre, telefono, rol } = data;

        // 1. Verificar si el usuario ya existe
        const usuarioExiste = await prisma.usuarios.findUnique({
            where: { email },
        });

        if (usuarioExiste) {
            throw new Error("El usuario ya existe con ese correo electrónico.");
        }

        // 2. Resolver el Rol (String -> ID)
        // Buscamos el rol por nombre, si no existe lo creamos (o fallamos, según preferencia)
        // Para asegurar que funcione "de una", si no existe lo creamos.
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

    async updateUser(id, data) {
        const { password, ...updateData } = data; // Evitar actualizar password aquí directamente

        // Si se envía 'rol' como string, habría que buscar el ID, pero por simplicidad
        // asumimos que updates vienen con datos simples o manejamos eso aparte.
        // Si el frontend manda 'rol' string y queremos actualizarlo:
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
