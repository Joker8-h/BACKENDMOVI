const vehiculosService = require("../SERVICES/VehiculosService");

const vehiculosController = {
    async create(req, res) {
        try {
            const { marca, modelo, placa, capacidad, fotoVehiculo } = req.body;

            const idUsuario = req.user.id;

            const nuevoVehiculo = await vehiculosService.create({
                idUsuario,
                marca,
                modelo,
                placa,
                capacidad: parseInt(capacidad),
                fotoVehiculo // Nueva propiedad
            });
            res.json(nuevoVehiculo);
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async getMyVehiculos(req, res) {
        try {
            const idUsuario = req.user.id;
            const vehiculos = await vehiculosService.findByUser(idUsuario);
            res.json(vehiculos);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getAll(req, res) {
        try {
            const vehiculos = await vehiculosService.findAll();
            res.json(vehiculos);
        } catch (error) {
            res.json({ error: error.message });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            const idUsuario = req.user.id;
            const userRole = req.user.rol;
            const physical = req.query.physical === 'true';

            await vehiculosService.delete(id, idUsuario, userRole, physical);
            res.json({ message: `Vehículo ${physical ? 'eliminado permanentemente' : 'desactivado'} correctamente` });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const { estado } = req.body;
            const idUsuario = req.user.id;

            const vehiculoActualizado = await vehiculosService.actualizarEstado(id, idUsuario, estado);
            res.json({ mensaje: `Vehículo ${estado.toLowerCase()} correctamente`, vehiculo: vehiculoActualizado });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const vehiculo = await vehiculosService.getById(id);
            if (!vehiculo) return res.status(404).json({ error: "Vehículo no encontrado" });
            res.json(vehiculo);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = vehiculosController;
