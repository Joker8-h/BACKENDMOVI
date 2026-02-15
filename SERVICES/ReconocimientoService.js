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

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Error de Python (Status ${response.status}):`, errorText);
                throw new Error(`Error ${response.status} en registro facial: ${errorText.substring(0, 100)}`);
            }

            const data = await response.json();
            console.log("Respuesta de Python (Registro):", JSON.stringify(data, null, 2));
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

            console.log(`Enviando petición a Python: ${RECONOCIMIENTO_URL}/verify-face`);
            const response = await fetch(`${RECONOCIMIENTO_URL}/verify-face`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Error de Python (Status ${response.status}):`, errorText);
                throw new Error(`El servicio de reconocimiento facial devolvió un error ${response.status}: ${errorText.substring(0, 100)}`);
            }

            const data = await response.json();
            console.log("Respuesta de Python (Verificación):", JSON.stringify(data, null, 2));
            return data;
        } catch (error) {
            console.error("Error en verificarRostro:", error);
            throw new Error("Error en la verificación facial: " + error.message);
        }
    },

    async compararRostros(imageUrl1, imageUrl2) {
        if (typeof fetch === 'undefined') {
            throw new Error("La función 'fetch' no está disponible.");
        }

        try {
            console.log(`Enviando petición a Python: ${RECONOCIMIENTO_URL}/compare-faces`);
            console.log(`  URL 1 (almacenada): ${imageUrl1}`);
            console.log(`  URL 2 (actual): ${imageUrl2}`);

            const response = await fetch(`${RECONOCIMIENTO_URL}/compare-faces`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageUrl1: imageUrl1,
                    imageUrl2: imageUrl2
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Error de Python (Status ${response.status}):`, errorText);
                throw new Error(`Error ${response.status} al comparar rostros: ${errorText.substring(0, 100)}`);
            }

            const data = await response.json();
            console.log("Respuesta de Python (Comparación):", JSON.stringify(data, null, 2));
            return data;
        } catch (error) {
            console.error("Error en compararRostros:", error);
            throw new Error("Error al comparar rostros: " + error.message);
        }
    }
};

module.exports = reconocimientoService;
