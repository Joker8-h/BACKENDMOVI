const axios = require('axios');
const FormData = require('form-data');

const aiObjectRecognitionService = {
    // URL del servidor Python (ajustar según configuración)
    AI_LICENSE_URL: process.env.AI_LICENSE_URL || "http://localhost:8000/predict",
    AI_PLATE_URL: process.env.AI_PLATE_URL || "http://localhost:8000/verificar-placa",

    /**
     * Envía una imagen para verificar su autenticidad (Licencia) y extraer datos.
     */
    async verificarAutenticidad(imageUrl) {
        try {
            console.log(`[AI-BRIDGE] Verificando licencia: ${imageUrl}`);
            const responseImage = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(responseImage.data, 'binary');

            const form = new FormData();
            form.append('file', buffer, { filename: 'license_image.jpg', contentType: 'image/jpeg' });

            const aiResponse = await axios.post(this.AI_LICENSE_URL, form, {
                headers: { ...form.getHeaders() }
            });

            const { is_fully_equipped, detected_items, missing_items, data, message } = aiResponse.data;

            return {
                sospecha_fraude: !is_fully_equipped,
                confianza: is_fully_equipped ? 0.98 : 0.45,
                detalles: message,
                detected_items,
                missing_items,
                extracted_data: data || {},
                error: false
            };
        } catch (error) {
            console.error("[AI-BRIDGE] Error en validación de licencia:", error.message);
            return { sospecha_fraude: false, confianza: 0, error: true, extracted_data: {} };
        }
    },

    /**
     * Envía una imagen para detectar placa y extraer texto vía OCR.
     */
    async verificarPlaca(imageUrl) {
        try {
            console.log(`[AI-BRIDGE] Verificando placa: ${imageUrl}`);
            const responseImage = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(responseImage.data, 'binary');

            const form = new FormData();
            form.append('file', buffer, { filename: 'plate_image.jpg', contentType: 'image/jpeg' });

            const aiResponse = await axios.post(this.AI_PLATE_URL, form, {
                headers: { ...form.getHeaders() }
            });

            const { is_detected, plate_text, detections, message } = aiResponse.data;

            return {
                is_detected,
                plate_text: plate_text || null,
                confianza: is_detected ? 0.95 : 0,
                detalles: message,
                error: false
            };
        } catch (error) {
            console.error("[AI-BRIDGE] Error en validación de placa:", error.message);
            return { is_detected: false, plate_text: null, confianza: 0, error: true, message: error.message };
        }
    }
};

module.exports = aiObjectRecognitionService;
