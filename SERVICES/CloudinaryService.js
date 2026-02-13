const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

const cloudinaryService = {
    async subirImagen(base64Image, folder = "face_recognition") {
        try {
            console.log("CloudinaryService: Iniciando subida de imagen...");
            // Asegurar el prefijo data:image/... para el uploader de cloudinary
            let cleanImage = base64Image;
            if (!cleanImage.startsWith('data:image')) {
                cleanImage = `data:image/jpeg;base64,${cleanImage}`;
            }

            console.log("CloudinaryService: Llamando a cloudinary.uploader.upload...");
            const result = await cloudinary.uploader.upload(cleanImage, {
                folder: folder
            });

            console.log("CloudinaryService: Subida exitosa. URL:", result.secure_url);
            return result.secure_url;
        } catch (error) {
            console.error("Error al subir imagen a Cloudinary (Node):", error);
            throw new Error("No se pudo subir la imagen a la nube");
        }
    }
};

module.exports = cloudinaryService;
