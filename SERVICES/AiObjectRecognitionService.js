const axios = require('axios');
const FormData = require('form-data');

const aiObjectRecognitionService = {
    // URL del servidor Python (ajustar según configuración)
    AI_URL: process.env.AI_LICENSE_URL || "http://localhost:8000/predict",

    /**
     * Envía una imagen para verificar su autenticidad y extraer datos.
     * @param {string} imageUrl URL de la imagen (Cloudinary o similar)
     */
    async verificarAutenticidad(imageUrl) {
        try {
            console.log(`[AI-BRIDGE] Verificando autenticidad y extrayendo datos para: ${imageUrl}`);

            // 1. Descargar la imagen
            const responseImage = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(responseImage.data, 'binary');

            // 2. Preparar el envío a la IA
            const form = new FormData();
            form.append('file', buffer, { filename: 'license_image.jpg', contentType: 'image/jpeg' });

            // 3. Llamar al servicio de IA
            const aiResponse = await axios.post(this.AI_URL, form, {
                headers: {
                    ...form.getHeaders()
                }
            });

            const { is_fully_equipped, detected_items, missing_items, data, message } = aiResponse.data;

            return {
                sospecha_fraude: !is_fully_equipped,
                confianza: is_fully_equipped ? 0.98 : 0.45,
                detalles: message,
                detected_items,
                missing_items,
                extracted_data: data || {}, // Aquí vendrá el OCR (nombre, número, etc.)
                error: false
            };
        } catch (error) {
            console.error("[AI-BRIDGE] Error al conectar con el servicio de IA:", error.message);
            // Si la IA falla, devolvemos un estado neutral para revisión manual
            return {
                sospecha_fraude: false,
                confianza: 0,
                error: true,
                message: `No se pudo contactar con el servicio de IA: ${error.message}`,
                extracted_data: {}
            };
        }
    }
};

module.exports = aiObjectRecognitionService;
