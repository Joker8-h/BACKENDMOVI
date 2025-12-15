# Nuevos Endpoints - API Completa

## 📌 Endpoints por Módulo

### 🔐 Roles
```
GET    /api/roles           → Lista todos los roles
GET    /api/roles/:id       → Obtiene rol por ID
POST   /api/roles           → Crea nuevo rol (admin)
PUT    /api/roles/:id       → Actualiza rol (admin)
DELETE /api/roles/:id       → Elimina rol (admin)
```

### 📍 Paradas
```
GET    /api/paradas                → Lista todas las paradas
GET    /api/paradas/ruta/:idRuta   → Paradas de una ruta
GET    /api/paradas/:id            → Obtiene parada por ID
POST   /api/paradas                → Crea parada
PUT    /api/paradas/:id            → Actualiza parada
DELETE /api/paradas/:id            → Elimina parada
```

### 🛣️ ViajeTramos
```
GET    /api/viaje-tramos/viaje/:idViaje                          → Tramos de un viaje
GET    /api/viaje-tramos/:idViaje/:idParadaInicio/:idParadaFin  → Tramo específico
POST   /api/viaje-tramos                                         → Crea tramo
POST   /api/viaje-tramos/generar                                 → Genera tramos automáticamente
PUT    /api/viaje-tramos/ocupacion                               → Actualiza ocupación
POST   /api/viaje-tramos/verificar-disponibilidad                → Verifica disponibilidad
```

### 💳 PlanesConductor
```
GET    /api/planes-conductor/activos  → Planes activos (público)
GET    /api/planes-conductor/:id      → Obtiene plan por ID (público)
GET    /api/planes-conductor          → Lista todos (admin)
POST   /api/planes-conductor          → Crea plan (admin)
PUT    /api/planes-conductor/:id      → Actualiza plan (admin)
DELETE /api/planes-conductor/:id      → Desactiva plan (admin)
```

### 🤖 IaRutasLog
```
GET    /api/ia-rutas-log                  → Lista todos los logs
GET    /api/ia-rutas-log/estadisticas     → Estadísticas de uso
GET    /api/ia-rutas-log/modelo/:modelo   → Logs por modelo IA
GET    /api/ia-rutas-log/ruta/:idRuta     → Logs de una ruta
GET    /api/ia-rutas-log/:id              → Obtiene log por ID
POST   /api/ia-rutas-log                  → Crea log
DELETE /api/ia-rutas-log/limpiar          → Limpia logs antiguos (admin)
```

---

## 📊 Resumen de API Completa

Total de módulos: **14**
Total de endpoints: **60+**

### Autenticación
- `/api/auth/*` - Login, registro, perfil

### Usuarios & Roles
- `/api/roles/*` - Gestión de roles ✨ NUEVO

### Vehículos
- `/api/vehiculos/*` - CRUD de vehículos

### Rutas & Paradas
- `/api/rutas/*` - CRUD de rutas
- `/api/paradas/*` - Gestión de paradas ✨ NUEVO

### Viajes
- `/api/viajes/*` - Gestión de viajes
- `/api/viaje-tramos/*` - Control de ocupación ✨ NUEVO
- `/api/reservas/*` - Reservas de pasajeros

### Comunicación
- `/api/chat/*` - Conversaciones y mensajes
- `/api/calificaciones/*` - Calificaciones

### Pagos & Planes
- `/api/pagos/*` - Gestión de pagos
- `/api/planes-conductor/*` - Planes de suscripción ✨ NUEVO
- `/api/suscripciones/*` - Suscripciones activas

### IA & Logs
- `/api/ia-rutas-log/*` - Logs de generación IA ✨ NUEVO

---

## 🎯 Casos de Uso Principales

### Para Conductores
1. Crear vehículo
2. Crear o seleccionar ruta con paradas
3. Publicar viaje (con generación automática de tramos)
4. Gestionar suscripciones a planes
5. Ver reservas de pasajeros
6. Calificar pasajeros

### Para Pasajeros
1. Buscar rutas disponibles
2. Ver paradas de ruta
3. Verificar disponibilidad de asientos
4. Hacer reserva
5. Ver historial de viajes
6. Calificar conductores

### Para Administradores
1. Gestionar roles
2. Gestionar usuarios
3. Crear y gestionar planes de conductor
4. Ver estadísticas de uso de IA
5. Limpiar logs antiguos

---

## ✅ Estado: COMPLETADO

✨ **Backend 100% funcional** con todos los modelos del schema Prisma implementados.
