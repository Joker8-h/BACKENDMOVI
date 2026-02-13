const RECONOCIMIENTO_URL = "https://reconocimientofacial-production-6b61.up.railway.app";

const reconocimientoService = {
    async registrarRostro(nombre, base64Image) {
        if (typeof fetch === 'undefined') {
            throw new Error("La función 'fetch' no está disponible. Asegúrate de usar Node.js 18+ o instalar 'node-fetch'.");
        }

        try {
            // Eliminar el prefijo data:image/... si existe para evitar problemas de tamaño/formato
            let cleanImage = base64Image;
            if (cleanImage.includes(',')) {
                cleanImage = cleanImage.split(',')[1];
            }

            const formData = new FormData();
            formData.append("nombre", nombre);
            formData.append("image", cleanImage);

            const response = await fetch(`${RECONOCIMIENTO_URL}/register-face`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Error en el registro facial del servicio externo");
            }
            return data;
        } catch (error) {
            console.error("Error en registrarRostro:", error);
            throw new Error("No se pudo conectar con el servicio de reconocimiento facial: " + error.message);
        }
    },

    async verificarRostro(base64Image) {
        if (typeof fetch === 'undefined') {
            throw new Error("La función 'fetch' no está disponible.");
        }

        try {
            let cleanImage = base64Image;
            if (cleanImage.includes(',')) {
                cleanImage = cleanImage.split(',')[1];
            }

            const formData = new FormData();
            formData.append("image", cleanImage);

            const response = await fetch(`${RECONOCIMIENTO_URL}/verify-face`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Rostro no reconocido por el sistema");
            }
            return data;
        } catch (error) {
            console.error("Error en verificarRostro:", error);
            throw new Error("Error en la verificación facial: " + error.message);
        }
    }
};

module.exports = reconocimientoService;
