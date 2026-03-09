const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({});
const axios = require("axios");
const notificacionesService = require("./NotificacionesService");

const RUTAS_PYTHON_URL = process.env.RUTAS_PYTHON_URL;

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

        // 4. Calcular Distancia y Precio (integrando rutaspython si es posible)
        let distanciaRecorrida = 0;
        let comisionPlataforma = 0;
        let precioFinal = 0;

        if (data.idParadaSubida && data.idParadaBajada) {
            // Si ambas son paradas de la ruta, intentamos usar el microservicio rutaspython
            try {
                if (RUTAS_PYTHON_URL && viaje.ruta && Array.isArray(viaje.ruta.paradas) && viaje.ruta.paradas.length >= 2) {
                    const paradasOrdenadas = [...viaje.ruta.paradas].sort((a, b) => a.orden - b.orden);

                    const idxSubida = paradasOrdenadas.findIndex(
                        (p) => p.idParada === parseInt(data.idParadaSubida)
                    );
                    const idxBajada = paradasOrdenadas.findIndex(
                        (p) => p.idParada === parseInt(data.idParadaBajada)
                    );

                    if (idxSubida !== -1 && idxBajada !== -1 && idxBajada > idxSubida) {
                        const stops = paradasOrdenadas.map((p) => ({
                            lat: parseFloat(p.lat),
                            lng: parseFloat(p.lng),
                        }));

                        const totalRoutePriceCop = Math.max(
                            1,
                            Math.round(parseFloat(viaje.precio || 0))
                        );

                        const body = {
                            stops,
                            total_route_price_cop: totalRoutePriceCop,
                            passengers: [
                                {
                                    passenger_id: idUsuario,
                                    start_index: idxSubida,
                                    end_index: idxBajada,
                                },
                            ],
                        };

                        const resp = await axios.post(
                            `${RUTAS_PYTHON_URL}/segment-fares`,
                            body,
                            { timeout: 10000 }
                        );

                        const pasajeroSegmento =
                            resp?.data?.passengers && resp.data.passengers[0]
                                ? resp.data.passengers[0]
                                : null;

                        if (
                            pasajeroSegmento &&
                            typeof pasajeroSegmento.fare_cop === "number" &&
                            pasajeroSegmento.fare_cop > 0
                        ) {
                            distanciaRecorrida = parseFloat(
                                pasajeroSegmento.distance_km || 0
                            );

                            const baseSegmento = pasajeroSegmento.fare_cop;
                            // Aplicamos la misma lógica de comisión (10% sobre el valor base del tramo)
                            comisionPlataforma = baseSegmento * 0.1;
                            precioFinal = baseSegmento + comisionPlataforma;
                        }
                    }
                }
            } catch (error) {
                console.error(
                    "Error al calcular precio con rutaspython /segment-fares:",
                    error.message
                );
            }

            // Si no se pudo calcular con rutaspython, usamos el kmAcumulado como antes
            if (precioFinal === 0) {
                distanciaRecorrida = Math.max(0, kmBajada - kmSubida);
            }
        }

        // Si aún no hay precioFinal (coordenadas personalizadas o fallback), usamos Haversine y reglas locales
        if (precioFinal === 0) {
            if (distanciaRecorrida === 0) {
                distanciaRecorrida = this.calcularDistancia(
                    latSubida,
                    lngSubida,
                    latBajada,
                    lngBajada
                );
            }

            // Precio base (ejemplo simple: $1500 + $500/km)
            const tarifaBase = 1500;
            const tarifaPorKm = 500;
            const subTotal = tarifaBase + (distanciaRecorrida * tarifaPorKm);

            // Comisión plataforma: 10% ADICIONAL al precio del viaje (El pasajero asume el costo)
            comisionPlataforma = subTotal * 0.10;
            precioFinal = subTotal + comisionPlataforma;
        }


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
                    comisionPlataforma: comisionPlataforma,

                    estado: 'RESERVADO'
                }
            });

            // Actualizar cupos del viaje
            await tx.viajes.update({
                where: { idViajes: viaje.idViajes },
                data: { cuposDisponibles: { decrement: 1 } }
            });

            // NOTIFICACIÓN AUTOMÁTICA
            try {
                const pasajero = await tx.usuarios.findUnique({ where: { idUsuarios: idUsuario } });
                await notificacionesService.crearNotificacion({
                    idUsuario: viaje.vehiculo.idUsuario,
                    titulo: "Nueva Reserva",
                    mensaje: `${pasajero.nombre} ha reservado un cupo en tu viaje de ${viaje.ruta.nombre || 'Ruta'}`,
                    tipo: "VIAJE"
                });
            } catch (notifError) {
                console.error("Error al crear notificación de reserva:", notifError.message);
            }

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

            // NOTIFICACIÓN AUTOMÁTICA
            try {
                const viaje = await tx.viajes.findUnique({
                    where: { idViajes: parseInt(idViaje) },
                    include: { vehiculo: true, ruta: true }
                });
                const pasajero = await tx.usuarios.findUnique({ where: { idUsuarios: idUsuario } });

                await notificacionesService.crearNotificacion({
                    idUsuario: viaje.vehiculo.idUsuario,
                    titulo: "Reserva Cancelada",
                    mensaje: `${pasajero.nombre} ha cancelado su reserva para el viaje de ${viaje.ruta.nombre || 'Ruta'}`,
                    tipo: "VIAJE"
                });
            } catch (notifError) {
                console.error("Error al crear notificación de cancelación:", notifError.message);
            }

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
