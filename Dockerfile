FROM node:20-alpine

# Instalar dependencias necesarias para Prisma y node
RUN apk add --no-cache openssl

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Generar el cliente de Prisma
RUN npx prisma generate

# Exponer el puerto configurado
EXPOSE 3000

# Comando para correr migraciones y arrancar el servidor
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
