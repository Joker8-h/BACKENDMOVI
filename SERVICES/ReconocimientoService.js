const RECONOCIMIENTO_URL = "https://reconocimientofacial-production-6b61.up.railway.app";

const reconocimientoService = {
    async registrarRostro(nombre, base64Image) {
        try {
            const formData = new FormData();
            formData.append("nombre", nombre);
            formData.append("image", base64Image);

            const response = await fetch(`${RECONOCIMIENTO_URL}/register-face`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Error en el reconocimiento facial");
            }
            return data;
        } catch (error) {
            console.error("Error en registrarRostro:", error);
            throw error;
        }
    },

    async verificarRostro(base64Image) {
        try {
            const formData = new FormData();
            formData.append("image", base64Image);

            const response = await fetch(`${RECONOCIMIENTO_URL}/verify-face`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Rostro no reconocido");
            }
            return data; // Retorna { user_id, username }
        } catch (error) {
            console.error("Error en verificarRostro:", error);
            throw error;
        }
    }
};

module.exports = reconocimientoService;
