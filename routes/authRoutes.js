// Archivo: backend/routes/authRoutes.js
// aqui definimos las rutas relacionadas con la autenticación, 
// como el registro y el inicio de sesión de usuarios. 
// Estas rutas se conectan con los controladores correspondientes para manejar la lógica de negocio.

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// 1. IMPORTAMOS EL GUARDIA DE SEGURIDAD (El que lee el Token)
const auth = require('../middleware/auth');
// 2. IMPORTAMOS MULTER (El mismo guardia que sube la ropa)
const upload = require('../config/cloudinary');
// POST /api/usuarios/enviar-otp
router.post('/enviar-otp', authController.generarOtpUsuario);
// Ruta para registrar un usuario nuevo
router.post('/registrar', authController.registrarUsuario);
// Ruta para iniciar sesión
// POST /api/auth/login
router.post('/login', authController.loginUsuario);

// 3. RUTA PRIVADA: OBTENER PERFIL
// GET /api/auth/perfil
// ¡Pasa primero por auth.verificarToken antes de llegar al controlador!
router.get('/perfil', auth.verificarToken, authController.obtenerPerfilUsuario);

// --- NUEVA RUTA PRIVADA: ACTUALIZAR PERFIL ---
// PUT /api/auth/perfil
// Usamos upload.single('fotoPerfil') para que atrape la imagen que enviaremos desde Flutter
router.put('/perfil', auth.verificarToken, upload.single('fotoPerfil'), authController.actualizarPerfil);

// --- RUTAS PARA RECUPERAR CONTRASEÑA ---
const { 
  generarOtpRecuperacion, 
  restablecerPassword 
} = require('../controllers/authController');

router.post('/recuperar-password', generarOtpRecuperacion);
router.post('/restablecer-password', restablecerPassword);

module.exports = router;