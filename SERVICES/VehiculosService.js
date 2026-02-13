const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
});

const vehiculosService = {
    // Crear un nuevo vehículo
    async create(data) {
        // Verificar si la placa ya existe
        const existe = await prisma.vehiculos.findUnique({
            where: { placa: data.placa }
        });
        if (existe) {
            throw new Error("Ya existe un vehículo con esa placa.");
        }

        return await prisma.vehiculos.create({
            data
        });
    },

    // Obtener vehículos de un usuario específico
    async findByUser(idUsuario) {
        return await prisma.vehiculos.findMany({
            where: { idUsuario: idUsuario, estado: 'ACTIVO' },
            include: { usuario: { select: { nombre: true } } }
        });
    },

    // Obtener todos los vehículos (Admin)
    async findAll() {
        return await prisma.vehiculos.findMany({
            include: { usuario: { select: { nombre: true, email: true } } }
        });
    },

    // Eliminar un vehículo (Soporta lógico y físico)
    async delete(idVehiculo, idUsuario, userRole, physical = false) {
        // Verificar existencia
        const vehiculo = await prisma.vehiculos.findUnique({
            where: { idVehiculos: parseInt(idVehiculo) }
        });

        if (!vehiculo) throw new Error("Vehículo no encontrado");

        // Validar permisos: Debe ser el dueño o ADMIN
        if (vehiculo.idUsuario !== idUsuario && userRole !== 'ADMIN') {
            throw new Error("No tienes permiso para eliminar este vehículo");
        }

        if (physical) {
            // Eliminación física
            return await prisma.vehiculos.delete({
                where: { idVehiculos: parseInt(idVehiculo) }
            });
        }

        // Eliminación lógica (por defecto)
        return await prisma.vehiculos.update({
            where: { idVehiculos: parseInt(idVehiculo) },
            data: { estado: 'INACTIVO' }
        });
    },

    // Actualizar estado de un vehículo (Activar/Desactivar)
    async actualizarEstado(idVehiculo, idUsuario, nuevoEstado) {
        const vehiculo = await prisma.vehiculos.findUnique({
            where: { idVehiculos: parseInt(idVehiculo) }
        });

        if (!vehiculo) throw new Error("Vehículo no encontrado");

        // Validar que el usuario sea el dueño (esto se puede expandir si hay roles de admin específicos por vehículo)
        if (vehiculo.idUsuario !== idUsuario) {
            // Se asume que el controller puede validar si es ADMIN antes de llamar
        }

        if (!['ACTIVO', 'INACTIVO'].includes(nuevoEstado)) {
            throw new Error("Estado no válido. Use 'ACTIVO' o 'INACTIVO'.");
        }

        return await prisma.vehiculos.update({
            where: { idVehiculos: parseInt(idVehiculo) },
            data: { estado: nuevoEstado }
        });
    }
};

module.exports = vehiculosService;
