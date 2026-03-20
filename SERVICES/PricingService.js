const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PricingService = {
    /**
     * Redondea al múltiplo de 100 más cercano (Mínimo 500 COP)
     */
    redondearCop(monto) {
        if (!monto || monto <= 0) return 0;
        const res = Math.ceil(monto / 100) * 100;
        return Math.max(res, 500);
    },

    /**
     * Calcula la distancia Haversine entre dos puntos
     */
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

    /**
     * Estima el precio de un tramo usando rutaspython o Haversine
     */
    async estimarPrecioTramo({
        idViaje,
        latSubida, lngSubida,
        latBajada, lngBajada,
        idParadaSubida, idParadaBajada,
        idUsuario = 0
    }) {
        let precioFinal = 0;
        let comisionPlataforma = 0;
        let distanciaRecorrida = 0;

        const viaje = await prisma.viajes.findUnique({
            where: { idViajes: parseInt(idViaje) },
            include: {
                ruta: {
                    include: {
                        paradas: { orderBy: { orden: 'asc' } }
                    }
                }
            }
        });

        if (!viaje) throw new Error("Viaje no encontrado");

        // 1. Intentar con rutaspython si hay IDs de paradas
        if (idParadaSubida && idParadaBajada) {
            try {
                const RUTAS_PYTHON_URL = process.env.RUTAS_PYTHON_URL;
                if (RUTAS_PYTHON_URL && viaje.ruta && viaje.ruta.paradas.length >= 2) {
                    const paradasOrdenadas = viaje.ruta.paradas;
                    const idxSubida = paradasOrdenadas.findIndex(p => p.idParada === parseInt(idParadaSubida));
                    const idxBajada = paradasOrdenadas.findIndex(p => p.idParada === parseInt(idParadaBajada));

                    if (idxSubida !== -1 && idxBajada !== -1 && idxBajada > idxSubida) {
                        const body = {
                            stops: paradasOrdenadas.map(p => ({ lat: parseFloat(p.lat), lng: parseFloat(p.lng) })),
                            total_route_price_cop: Math.max(1, Math.round(parseFloat(viaje.precio || 0))),
                            passengers: [{ passenger_id: idUsuario, start_index: idxSubida, end_index: idxBajada }]
                        };

                        const resp = await axios.post(`${RUTAS_PYTHON_URL}/segment-fares`, body, { timeout: 10000 });
                        const seg = resp?.data?.passengers?.[0];

                        if (seg && seg.fare_cop > 0) {
                            distanciaRecorrida = parseFloat(seg.distance_km || 0);
                            const baseSegmento = seg.fare_cop;
                            comisionPlataforma = this.redondearCop(baseSegmento * 0.1);
                            precioFinal = this.redondearCop(baseSegmento + comisionPlataforma);
                        }
                    }
                }
            } catch (err) {
                console.warn("PricingService: RutasPython falló, usando fallback", err.message);
            }
        }

        // 2. Fallback Haversine
        if (precioFinal === 0) {
            if (distanciaRecorrida === 0) {
                distanciaRecorrida = this.calcularDistancia(latSubida, lngSubida, latBajada, lngBajada);
            }
            const tarifaBase = 1500;
            const tarifaPorKm = 500;
            const subTotal = tarifaBase + (distanciaRecorrida * tarifaPorKm);
            comisionPlataforma = this.redondearCop(subTotal * 0.10);
            precioFinal = this.redondearCop(subTotal + comisionPlataforma);
        }

        return {
            precioFinal,
            comisionPlataforma,
            distanciaRecorrida,
            precioFormateado: `$ ${this.redondearCop(precioFinal).toLocaleString('es-CO')} COP`
        };
    }
};

module.exports = PricingService;
