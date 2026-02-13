const vehiculosService = require("../SERVICES/VehiculosService");

const vehiculosController = {
    async create(req, res) {
        try {
            const { marca, modelo, placa, capacidad } = req.body;

            const idUsuario = req.user.id;

            const nuevoVehiculo = await vehiculosService.create({
                idUsuario,
                marca,
                modelo,
                placa,
                capacidad: parseInt(capacidad)
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
            await vehiculosService.delete(id, idUsuario);
            res.json({ message: "Vehículo eliminado correctamente" });
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
    }
};
};

module.exports = vehiculosController;
