const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "secreto_super_seguro";

class SocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // userId -> { socketId, role, nombre }
    }

    init(server) {
        this.io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token || socket.handshake.query.token;
            if (!token) {
                return next(new Error("Authentication error: No token provided"));
            }

            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                socket.user = decoded;
                next();
            } catch (err) {
                return next(new Error("Authentication error: Invalid token"));
            }
        });

        this.io.on("connection", (socket) => {
            const { id, rol, nombre } = socket.user;

            console.log(`Usuario conectado: ${nombre} (${rol}) - Socket: ${socket.id}`);

            this.connectedUsers.set(id, {
                socketId: socket.id,
                role: rol,
                nombre,
                connectedAt: new Date()
            });

            // Notificar a los admins que alguien se conectó
            this.emitToAdmins("user_connected", {
                id,
                nombre,
                rol,
                socketId: socket.id
            });

            socket.on("disconnect", () => {
                console.log(`Usuario desconectado: ${nombre} - Socket: ${socket.id}`);
                this.connectedUsers.delete(id);

                this.emitToAdmins("user_disconnected", {
                    id,
                    nombre
                });
            });
        });

        console.log("Socket.io inicializado correctamente");
    }

    emitToAdmins(event, data) {
        if (!this.io) return;

        for (const [userId, userInfo] of this.connectedUsers.entries()) {
            if (userInfo.role === "ADMIN") {
                this.io.to(userInfo.socketId).emit(event, data);
            }
        }
    }

    getOnlineUsers() {
        return Array.from(this.connectedUsers.entries()).map(([id, info]) => ({
            id,
            nombre: info.nombre,
            role: info.role,
            connectedAt: info.connectedAt
        }));
    }

    notifyNewRegistration(user) {
        this.emitToAdmins("new_user_registration", {
            id: user.idUsuarios,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol.nombre,
            fecha: new Date()
        });
    }
}

module.exports = new SocketService();
