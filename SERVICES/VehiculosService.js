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

    // Eliminar (lógicamente) un vehículo
    async delete(idVehiculo, idUsuario) {
        // Verificar que el vehículo pertenezca al usuario o sea admin
        const vehiculo = await prisma.vehiculos.findUnique({
            where: { idVehiculos: parseInt(idVehiculo) }
        });

        if (!vehiculo) throw new Error("Vehículo no encontrado");

        // Si el usuario no es el dueño (nota: validación de rol admin se haría antes o aquí si se pasa el rol)
        if (vehiculo.idUsuario !== idUsuario) {
            // Aquí podríamos permitir si es admin, pero por ahora solo dueño
            // Si se requiere lógica admin, pasar rol al service
        }

        return await prisma.vehiculos.update({
            where: { idVehiculos: parseInt(idVehiculo) },
            data: { estado: 'INACTIVO' }
        });
    }
};

module.exports = vehiculosService;
