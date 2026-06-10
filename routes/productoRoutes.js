// Archivo: backend/routes/productoRoutes.js
//Aquí conectamos la URL con la función del controlador
// Este archivo tambien define las rutas para los productos. 
// Aquí es donde decimos que cuando llegue una petición POST a /api/productos, 
// se ejecute la función crearProducto del controlador.
const express = require('express');
const router = express.Router();
// Importamos el controlador que tiene la lógica para crear un producto
const productoController = require('../controllers/productoController');
const upload = require('../config/cloudinary'); // 1. Importamos a nuestro "portero"
const auth = require('../middleware/auth'); // 1. Importamos a nuestro guardia de seguridad
// --- Importamos a nuestro guardia anti-crasheos ---
const validarMongoId = require('../middleware/validarMongoId');

// rutas para filtrar por marca se pone antes de la ruta general para obtener productos,
//  porque si no, se va a confundir y va a pensar que "marcas" es un ID de producto
router.get('/marcas', productoController.obtenerMarcas);

// 2. Le metemos el middleware upload.single('imagen')
// Esto le dice que espere UN solo archivo y que ese archivo vendrá en un campo llamado 'imagen'
router.post('/', auth.verificarToken, upload.array('imagenes', 4), productoController.crearProducto);
// Ruta: POST /api/productos

// READ: Obtener todos los productos
router.get('/', productoController.obtenerProductos);

// UPDATE: Actualizar un producto específico (necesitamos su ID)
router.put('/:id', auth.verificarToken, upload.array('imagenes', 4), productoController.actualizarProducto);

// DELETE: Eliminar un producto específico (necesitamos su ID)
router.delete('/:id', validarMongoId, auth.verificarTokenYRol, productoController.eliminarProducto);

// Ruta para obtener solo los productos del usuario que está logueado
router.get('/mis-productos', auth.verificarToken, productoController.obtenerMisProductos);

module.exports = router;