// Archivo: middleware/auth.js
// aquí definimos el middleware de autenticación que se encargará de verificar los tokens JWT 
// en las solicitudes protegidas.
// Este middleware se usará en las rutas que requieren que el usuario esté autenticado, 
// como las rutas de pedidos o de productos para marcas.

const jwt = require('jsonwebtoken');

// Función auxiliar para extraer el token sea como sea que venga
const extraerToken = (req) => {
    let token = req.header('x-auth-token'); // Como lo manda Postman a veces
    if (!token && req.header('Authorization')) {
        // Como lo manda Flutter (Authorization: Bearer <token>)
        token = req.header('Authorization').replace('Bearer ', '');
    }
    return token;
};

exports.verificarToken = (req, res, next) => {
    const token = extraerToken(req);
    
    if (!token) {
        return res.status(401).json({ msg: 'No hay token bro, inicia sesión primero 🛑' });
    }

    try {
        const cifrado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = cifrado.usuario;
        next();
    } catch (error) {
        res.status(401).json({ msg: 'Token no válido o expirado' });
    }
};

exports.verificarTokenYRol = (req, res, next) => {
    const token = extraerToken(req);
    
    if (!token) {
        return res.status(401).json({ msg: 'No hay token bro 🛑' });
    }

    try {
        const cifrado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = cifrado.usuario;

        if (req.usuario.rol !== 'marca' && req.usuario.rol !== 'admin') {
            return res.status(403).json({ msg: 'Solo marcas autorizadas pueden hacer esto 🛑' });
        }
        next();
    } catch (error) {
        res.status(401).json({ msg: 'Token no válido' });
    }
};

// --- EL NUEVO CANDADO BLINDADO ---
exports.verificarAdmin = async (req, res, next) => {
  try {
    // 1. Buscamos al usuario en la base de datos para ver su rol real y actual
    const Usuario = require('../models/Usuario');
    const usuario = await Usuario.findById(req.usuario.id);

    // 2. Si no es admin (o marca, si quieres que las marcas también aprueben), lo pateamos
    if (!usuario || (usuario.rol !== 'admin' && usuario.rol !== 'marca')) {
      return res.status(403).json({ msg: "Acceso denegado. No tienes permisos de Jefe bro 🛑" });
    }

    // 3. Si es el jefe, lo dejamos pasar a la ruta
    next();
  } catch (error) {
    console.error("Error en verificarAdmin:", error);
    res.status(500).json({ msg: "Hubo un error al verificar tus permisos" });
  }
};