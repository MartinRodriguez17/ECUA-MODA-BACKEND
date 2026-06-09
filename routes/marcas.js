// Archivo: routes/marcas.js
// aquí definimos las rutas relacionadas con las marcas,
// como el registro de nuevas marcas y el envío de OTP para verificación. 
// Estas rutas se conectan con los controladores correspondientes para manejar la lógica de negocio.
const express = require('express');
const router = express.Router();
const marcaController = require('../controllers/marcaController');

// POST /api/marcas/registro
router.post('/registro', marcaController.solicitarRegistroMarca);
// POST /api/marcas/enviar-otp
router.post('/enviar-otp', marcaController.generarOtp);
module.exports = router;