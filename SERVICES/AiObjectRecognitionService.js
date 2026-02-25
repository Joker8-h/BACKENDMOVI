const axios = require('axios');
const FormData = require('form-data');

const aiObjectRecognitionService = {
    // URL del servidor Python (ajustar según configuración)
    get AI_LICENSE_URL() {
        let url = process.env.AI_LICENSE_URL || "http://localhost:8000/predict";
        if (url && !url.startsWith('http')) {
            url = 'https://' + url;
        }
        // Si la URL no termina en /predict, se añade (a menos que ya tenga otra ruta)
        if (url && !url.includes('/predict') && !url.includes('/verificar-')) {
            url = url.endsWith('/') ? url + 'predict' : url + '/predict';
        }
        return url;
    },
    get AI_PLATE_URL() {
        let url = process.env.AI_PLATE_URL || "http://localhost:8000/verificar-placa";
        if (url && !url.startsWith('http')) {
            url = 'https://' + url;
        }
        // Si la URL no termina en /verificar-placa, se añade
        if (url && !url.includes('/verificar-placa')) {
            url = url.endsWith('/') ? url + 'verificar-placa' : url + '/verificar-placa';
        }
        return url;
    },

    /**
     * Envía una imagen para verificar su autenticidad (Licencia) y extraer datos.
     */
    async verificarAutenticidad(imageUrl) {
        try {
            console.log(`[AI-BRIDGE] Descargando imagen desde Cloudinary para Licencia: ${imageUrl}`);
            const responseImage = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            console.log(`[AI-BRIDGE] Imagen descargada exitosamente (${responseImage.data.length} bytes). Enviando a servicio Python...`);
            const buffer = Buffer.from(responseImage.data, 'binary');

            const form = new FormData();
            form.append('file', buffer, { filename: 'license_image.jpg', contentType: 'image/jpeg' });

            console.log(`[AI-BRIDGE] URL de IA: ${this.AI_LICENSE_URL}`);
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
