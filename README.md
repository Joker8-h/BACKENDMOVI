# Moviflex Backend - Guía de Inicio Rápido

## 🚀 Descripción
Este es el backend de **Moviflex**, una plataforma diseñada para gestionar viajes compartidos, conductores y pasajeros. Utiliza una arquitectura basada en **Node.js** con **Express** y **Prisma ORM** para la gestión de la base de datos MySQL.

## 🛠️ Tecnologías Principales
- **Entorno de ejecución:** Node.js
- **Framework Web:** Express.js (v5.2.1)
- **Base de Datos:** MySQL
- **ORM:** Prisma (v6.19.0)
- **Autenticación:** JSON Web Tokens (JWT) y Google Auth Library
- **Comunicación en Tiempo Real:** Socket.io
- **Almacenamiento de Imágenes:** Cloudinary
- **Notificaciones/Correos:** Sib-api-v3-sdk (Brevo)

## 🤖 Servicios de Inteligencia Artificial (FastAPI)
El backend se integra con microservicios externos basados en **FastAPI** para potencias funcionalidades avanzadas:
- **Optimización de Rutas:** Servicio que calcula las trayectorias más eficientes.
- **Reconocimiento de Placas:** IA especializada en extraer y validar números de placa desde imágenes.
- **Predicción de Objetos:** Servicio de análisis de imágenes para validación de seguridad.

## 📋 Requisitos Previos
- Node.js (v18 o superior recomendado)
- MySQL Server
- Una cuenta de Cloudinary (para gestión de fotos)
- Credenciales de Brevo (para envío de correos)

## 🔧 Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd BACKENDMOVI
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto basándote en el siguiente esquema:
   ```env
   DATABASE_URL="mysql://usuario:password@localhost:3306/nombre_db"
   JWT_SECRET="tu_secreto_super_seguro"
   CLOUDINARY_CLOUD_NAME="tu_cloud_name"
   CLOUDINARY_API_KEY="tu_api_key"
   CLOUDINARY_API_SECRET="tu_api_secret"
   BREVO_API_KEY="tu_brevo_api_key"
   GOOGLE_CLIENT_ID="tu_google_client_id"
   ```

4. **Preparar la Base de Datos (Prisma):**
   ```bash
   # Generar el cliente de Prisma
   npx prisma generate
   
   # Ejecutar migraciones (si es necesario)
   npx prisma migrate dev
   
   # Poblar la base de datos con datos iniciales (opcional)
   npm run seed
   ```

## 🚀 Cómo Correr el Proyecto

- **Modo Desarrollo (con recarga automática):**
  ```bash
  npm run dev
  ```

- **Modo Producción:**
  ```bash
  npm start
  ```

## 📂 Estructura del Proyecto
- `index.js`: Punto de entrada del servidor.
- `ROUTES/`: Definición de los endpoints de la API.
- `CONTROLLERS/`: Lógica de negocio para cada ruta.
- `SERVICES/`: Servicios externos o lógica reutilizable.
- `MIDDLEWARE/`: Funciones de validación y seguridad.
- `prisma/`: Esquema de la base de datos y migraciones.
- `__tests__/`: Pruebas unitarias e integrales (Jest).

## 🧪 Pruebas
Para ejecutar las pruebas del backend:
```bash
npm test
```
