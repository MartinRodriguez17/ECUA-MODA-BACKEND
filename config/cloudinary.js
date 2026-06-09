// Archivo: backend/config/cloudinary.js
// aqui configuramos Cloudinary para que Multer sepa dónde guardar las imágenes 
// que subamos desde el formulario de productos.

// Requerimos las librerías necesarias
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 1. Configuramos Cloudinary con tus llaves del .env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // El nombre de tu nube en Cloudinary
    api_key: process.env.CLOUDINARY_API_KEY,  // Tu API Key de Cloudinary
    api_secret: process.env.CLOUDINARY_API_SECRET // Tu API Secret de Cloudinary
});

// 2. Le decimos dónde y cómo guardar los archivos
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'HubModa_Productos', // Así se llamará la carpeta en tu nube
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], // Solo permitimos imágenes
    },
});

// 3. Creamos el "portero" de Multer con esa configuración
const upload = multer({ storage: storage });

// 4. Exportamos el middleware para usarlo en las rutas de productos
module.exports = upload;