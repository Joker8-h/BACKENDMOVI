# Documentación de Pruebas y Casos de Uso - Backend Moviflex

## 🧪 Estrategia de Pruebas (Backend)

El backend utiliza **Jest** como framework de pruebas y **Supertest** para realizar peticiones HTTP simuladas a los endpoints.

### Pruebas Automatizadas
Se encuentran en la carpeta `__tests__/` y cubren los siguientes aspectos:

- **Autenticación y Seguridad:**
    - Registro de usuarios con validación de campos.
    - Inicio de sesión y generación de tokens JWT.
    - Protección contra fuerza bruta (Rate Limiting).
    - Verificación de cabeceras de seguridad.
- **Gestión de Vehículos:**
    - Registro de nuevos vehículos vinculados a un usuario.
    - Validación de estados del vehículo (Activo/Inactivo).
- **Flujo de Viajes:**
    - Creación de rutas y paradas.
    - Publicación de viajes con gestión de cupos.
    - Lógica de reservas y actualización de asientos disponibles.
- **Servicios en Tiempo Real:**
    - Pruebas de conexión y emisión de eventos con Socket.io.

**Comando de ejecución:**
```bash
npm test
```

---

## 📋 Casos de Uso Implementados

### 1. Gestión de Acceso y Seguridad
- **CU01 - Registro con OTP:** El sistema envía un código de 6 dígitos al correo del usuario. La cuenta solo se activa si el código es válido.
- **CU02 - Autenticación JWT:** Emisión de tokens seguros para mantener la sesión y proteger rutas privadas.
- **CU03 - Recuperación de Password:** Flujo de solicitud de cambio de clave mediante token temporal enviado por email.

### 2. Lógica de Transporte
- **CU04 - Registro de Vehículo e IA:** Recepción de fotos del vehículo y placa. Conexión con **FastAPI (AI_PLATE_URL)** para la validación automática de placas mediante visión artificial.
- **CU05 - Creación de Rutas Inteligentes:** Definición de paradas con coordenadas. El sistema utiliza un servicio de **FastAPI (RUTAS_PYTHON_URL)** para optimizar los tramos y calcular distancias exactas.
- **CU06 - Motor de Reservas:** Gestión concurrente de asientos. El sistema impide reservar más asientos de los disponibles en un viaje específico.

### 3. Monetización y Comunicación
- **CU07 - Suscripciones de Conductor:** Validación de planes activos para permitir la publicación de viajes (Semanal, Mensual, etc.).
- **CU08 - Gestión de Pagos:** Registro de transacciones y estados de pago (Pendiente, Pagado, Confirmado).
- **CU09 - Backend de Mensajería:** Almacenamiento y distribución de mensajes de chat vinculados a un viaje.
