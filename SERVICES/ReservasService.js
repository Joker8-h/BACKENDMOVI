const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
});

const reservasService = {
    // Crear reserva (Usuario reserva un viaje)
    async crearReserva(idUsuario, data) {
        // 1. Verificar viaje existente
        const viaje = await prisma.viajes.findUnique({
            where: { idViajes: parseInt(data.idViajes) },
            include: {
                ruta: {
                    include: {
                        paradas: { orderBy: { orden: 'asc' } } // Necesario para validar paradas
                    }
                },
                vehiculo: true
            }
        });

        if (!viaje) throw new Error("Viaje no encontrado");

        // 2. Verificar cupos disponibles
        if (viaje.cuposDisponibles <= 0) {
            throw new Error("No hay cupos disponibles en este viaje.");
        }

        // 3. Validar Paradas vs Coordenadas (Modelo Híbrido)

        // --- SUBIDA ---
        let latSubida, lngSubida, nombreSubida, kmSubida;

        if (data.idParadaSubida) {
            const parada = viaje.ruta.paradas.find(p => p.idParada === parseInt(data.idParadaSubida));
            if (!parada) throw new Error("La parada de subida no pertenece a la ruta del viaje.");

            // Usar datos de la parada
            latSubida = parseFloat(parada.lat);
            lngSubida = parseFloat(parada.lng);
            nombreSubida = parada.nombre;
            kmSubida = parseFloat(parada.kmAcumulado || 0);
        } else if (data.latSubida && data.lngSubida) {
            // Usar coordenadas personalizadas
            latSubida = parseFloat(data.latSubida);
            lngSubida = parseFloat(data.lngSubida);
            nombreSubida = data.nombreSubida || "Punto personalizado";
            // Calcular km aproximado basado en la ruta (simplificado: asume 0 si no hay punto de referencia)
            // Idealmente aquí se proyectaría sobre la ruta, pero por ahora lo dejamos en null o calculamos desde origen
            kmSubida = 0; // Se ajustará con lógica de negocio más avanzada
        } else {
            throw new Error("Debe indicar un punto de subida (parada o coordenadas).");
        }

        // --- BAJADA ---
        let latBajada, lngBajada, nombreBajada, kmBajada;

        if (data.idParadaBajada) {
            const parada = viaje.ruta.paradas.find(p => p.idParada === parseInt(data.idParadaBajada));
            if (!parada) throw new Error("La parada de bajada no pertenece a la ruta del viaje.");

            // Usar datos de la parada
            latBajada = parseFloat(parada.lat);
            lngBajada = parseFloat(parada.lng);
            nombreBajada = parada.nombre;
            kmBajada = parseFloat(parada.kmAcumulado || 0);

            // Validar orden si ambas son paradas
            if (data.idParadaSubida) {
                const paradaSub = viaje.ruta.paradas.find(p => p.idParada === parseInt(data.idParadaSubida));
                if (paradaSub && parada.orden <= paradaSub.orden) {
                    throw new Error("La parada de bajada debe estar después de la de subida.");
                }
            }

        } else if (data.latBajada && data.lngBajada) {
            // Usar coordenadas personalizadas
            latBajada = parseFloat(data.latBajada);
            lngBajada = parseFloat(data.lngBajada);
            nombreBajada = data.nombreBajada || "Punto personalizado";
            kmBajada = 0;
        } else {
            throw new Error("Debe indicar un punto de bajada (parada o coordenadas).");
        }

        // 4. Calcular Distancia y Precio
        let distanciaRecorrida = 0;
        if (data.idParadaSubida && data.idParadaBajada) {
            // Si ambas son paradas, usar kmAcumulado
            distanciaRecorrida = Math.max(0, kmBajada - kmSubida);
        } else {
            // Si hay coordenadas personalizadas, usar Haversine puro
            distanciaRecorrida = this.calcularDistancia(latSubida, lngSubida, latBajada, lngBajada);
        }

        // Precio base (ejemplo simple: $1500 + $500/km)
        // Puedes ajustar esto según tu lógica de negocio
        const tarifaBase = 1500;
        const tarifaPorKm = 500;
        const precioFinal = tarifaBase + (distanciaRecorrida * tarifaPorKm);


        // 5. Crear reserva y descontar cupo en una transacción
        return await prisma.$transaction(async (tx) => {
            const reserva = await tx.usuarioViaje.create({
                data: {
                    idUsuarios: idUsuario,
                    idViajes: parseInt(data.idViajes),

                    // Paradas referenciadas (opcionales)
                    idParadaSubida: data.idParadaSubida ? parseInt(data.idParadaSubida) : null,
                    idParadaBajada: data.idParadaBajada ? parseInt(data.idParadaBajada) : null,

                    // Coordenadas Subida
                    latSubida: latSubida,
                    lngSubida: lngSubida,
                    nombreSubida: nombreSubida,

                    // Coordenadas Bajada
                    latBajada: latBajada,
                    lngBajada: lngBajada,
                    nombreBajada: nombreBajada,

                    asientosReservados: 1,
                    distanciaRecorrida: distanciaRecorrida,
                    precioFinal: precioFinal,

                    estado: 'RESERVADO'
                }
            });

            // Actualizar cupos del viaje
            await tx.viajes.update({
                where: { idViajes: viaje.idViajes },
                data: { cuposDisponibles: { decrement: 1 } }
            });

            return reserva;
        });
    },

    // Obtener mis reservas (Pasajero)
    async getMisReservas(idUsuario) {
        return await prisma.usuarioViaje.findMany({
            where: { idUsuarios: idUsuario },
            include: {
                viaje: {
                    include: {
                        ruta: true, // Para ver origen/destino del viaje
                        vehiculo: true
                    }
                },
                paradaSubida: true,
                paradaBajada: true
            }
        });
    },

    // Cancelar reserva
    async cancelarReserva(idUsuario, idViaje) {
        // Verificar que la reserva exista y sea del usuario (idUsuario, idViaje es clave compuesta)
        const reserva = await prisma.usuarioViaje.findUnique({
            where: {
                idUsuarios_idViajes: {
                    idUsuarios: idUsuario,
                    idViajes: parseInt(idViaje)
                }
            }
        });

        if (!reserva) throw new Error("Reserva no encontrada");

        if (reserva.estado === 'CANCELADO') throw new Error("La reserva ya está cancelada");

        // Transacción para actualizar estado y devolver cupo
        return await prisma.$transaction(async (tx) => {
            const actualizada = await tx.usuarioViaje.update({
                where: {
                    idUsuarios_idViajes: {
                        idUsuarios: idUsuario,
                        idViajes: parseInt(idViaje)
                    }
                },
                data: { estado: 'CANCELADO' }
            });

            await tx.viajes.update({
                where: { idViajes: parseInt(idViaje) },
                data: { cuposDisponibles: { increment: 1 } }
            });

            return actualizada;
        });
    },

    // Helper: Distancia Haversine
    calcularDistancia(lat1, lng1, lat2, lng2) {
        const R = 6371; // Radio Tierra km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    // Obtener una reserva por ID (Clave compuesta)
    async getById(idUsuarios, idViajes) {
        return await prisma.usuarioViaje.findUnique({
            where: {
                idUsuarios_idViajes: {
                    idUsuarios: parseInt(idUsuarios),
                    idViajes: parseInt(idViajes)
                }
            },
            include: {
                usuario: { select: { nombre: true, email: true } },
                viaje: { include: { ruta: true, vehiculo: true } },
                paradaSubida: true,
                paradaBajada: true
            }
        });
    }
};

module.exports = reservasService;
