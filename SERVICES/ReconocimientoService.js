const RECONOCIMIENTO_URL = "https://reconocimientofacial-production-6b61.up.railway.app";

const reconocimientoService = {
    async registrarRostro(nombre, base64Image, imageUrl = null) {
        if (typeof fetch === 'undefined') {
            throw new Error("La función 'fetch' no está disponible. Asegúrate de usar Node.js 18+.");
        }

        try {
            const formData = new FormData();
            formData.append("nombre", nombre);

            if (imageUrl) {
                formData.append("imageUrl", imageUrl);
            } else if (base64Image) {
                let cleanImage = base64Image;
                if (cleanImage.includes(',')) cleanImage = cleanImage.split(',')[1];
                formData.append("image", cleanImage);
            } else {
                throw new Error("Debe proporcionar una imagen o una URL");
            }

            const response = await fetch(`${RECONOCIMIENTO_URL}/register-face`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                console.error("Detalle del error 422/400 de FastAPI:", JSON.stringify(data, null, 2));
                throw new Error(data.detail ? JSON.stringify(data.detail) : "Error en el registro facial");
            }
            return data;
        } catch (error) {
            console.error("Error en registrarRostro:", error);
            throw new Error("Error de conexión con el servicio facial: " + error.message);
        }
    },

    async verificarRostro(base64Image, imageUrl = null) {
        if (typeof fetch === 'undefined') {
            throw new Error("La función 'fetch' no está disponible.");
        }

        try {
            const formData = new FormData();

            if (imageUrl) {
                formData.append("imageUrl", imageUrl);
            } else if (base64Image) {
                let cleanImage = base64Image;
                if (cleanImage.includes(',')) cleanImage = cleanImage.split(',')[1];
                formData.append("image", cleanImage);
            } else {
                throw new Error("Debe proporcionar una imagen o una URL");
            }

            const response = await fetch(`${RECONOCIMIENTO_URL}/verify-face`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Rostro no reconocido");
            }
            return data;
        } catch (error) {
            console.error("Error en verificarRostro:", error);
            throw new Error("Error en la verificación facial: " + error.message);
        }
    }
};

module.exports = reconocimientoService;
