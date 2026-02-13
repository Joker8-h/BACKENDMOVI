require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const rateLimit = require('express-rate-limit');

app.set('trust proxy', 1);

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting Global
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // Límite de 1000 peticiones por ventana
    message: 'Demasiadas peticiones desde esta IP, por favor intente más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(generalLimiter);
app.use(express.json());


const authRoutes = require('./ROUTES/Authroutes');
const vehiculosRoutes = require('./ROUTES/VehiculosRoutes');
const rutasRoutes = require('./ROUTES/RutasRoutes');
const viajesRoutes = require('./ROUTES/ViajesRoutes');
const reservasRoutes = require('./ROUTES/ReservasRoutes');
const pagosRoutes = require('./ROUTES/PagosRoutes');
const chatRoutes = require('./ROUTES/ChatRoutes');
const calificacionesRoutes = require('./ROUTES/CalificacionesRoutes');
const suscripcionesRoutes = require('./ROUTES/SuscripcionesRoutes');
const rolesRoutes = require('./ROUTES/RolesRoutes');
const paradasRoutes = require('./ROUTES/ParadasRoutes');
const viajeTramosRoutes = require('./ROUTES/ViajeTramosRoutes');
const planesConductorRoutes = require('./ROUTES/PlanesConductorRoutes');
const iaRutasLogRoutes = require('./ROUTES/IaRutasLogRoutes');
const documentacionRoutes = require('./ROUTES/DocumentacionRoutes');

// Usar Rutas
app.use('/api/auth', authRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/rutas', rutasRoutes);
app.use('/api/viajes', viajesRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/calificaciones', calificacionesRoutes);
app.use('/api/suscripciones', suscripcionesRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/paradas', paradasRoutes);
app.use('/api/viaje-tramos', viajeTramosRoutes);
app.use('/api/planes-conductor', planesConductorRoutes);
app.use('/api/ia-rutas-log', iaRutasLogRoutes);
app.use('/api/documentacion', documentacionRoutes);






const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
