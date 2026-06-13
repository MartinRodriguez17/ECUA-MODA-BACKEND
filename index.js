// index.js es el punto de entrada de nuestro backend.
// Aquí configuramos el servidor, conectamos a la base de datos y definimos las rutas principales.

// index.js es el punto de entrada de nuestro backend.
// Aquí configuramos el servidor, conectamos a la base de datos y definimos las rutas principales.

const express = require("express"); // El framework para crear el servidor y manejar rutas
const cors = require("cors");  // Middleware para permitir solicitudes desde el frontend (CORS)
const helmet = require("helmet");  // Middleware para agregar cabeceras de seguridad y proteger contra ataques comunes
const rateLimit = require("express-rate-limit");  // Middleware para limitar la cantidad de solicitudes y proteger contra ataques DDoS
require("dotenv").config();  // Carga las variables de entorno desde el archivo .env (como la conexión a la base de datos y las claves de Cloudinary)
const conectarDB = require("./config/db"); // Función para conectar a la base de datos MongoDB usando Mongoose

const app = express();
const PORT = process.env.PORT || 4000;

conectarDB();

// ==========================================
//    CAPA 1: SEGURIDAD GLOBAL DE RED
// ==========================================
app.use(helmet()); 
app.use(cors()); 
app.set('trust proxy', 1); 

// Control de tráfico anti-DDoS global
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 100, 
  message: { msg: "Demasiadas peticiones desde esta IP, cálmate bro 🛑" },
  keyGenerator: (req) => {
    // Si no hay body o no hay email, usa la IP. Si algo falla, usa 'anonymous'
    return req.ip || (req.body && req.body.email) || "anonymous";
  }
});
app.use(limiter);

// ==========================================
//   CAPA 2: PARSING (TRADUCCIÓN A JSON)
// ==========================================
// VITAL: Esto debe ir ANTES de cualquier sanitizador o validador
app.use(express.json()); 


// ==========================================
//   CAPA 3: LIMITADOR DE OTP ESPECÍFICO
// ==========================================
// Ojo: Lo ponemos después de express.json() para que pueda leer req.body.email si es necesario
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  
  max: 3,  
  keyGenerator: (req, res) => {
    // Usa el correo (que ahora se llama email en authController) o la IP
    return (req.body && req.body.email) ? req.body.email : req.ip;
  },
  message: { msg: "Demasiados intentos. Espera 15 minutos antes de solicitar otro código 🛑" },
  skip: (req, res) => {
    const rutasOtp = ['/enviar-otp', '/recuperar-password'];   /// se amplia la cantidad de envios de codigo OTP, ahora incluye la ruta de recuperación de contraseña
  return !rutasOtp.some(ruta => req.path.includes(ruta));
  }
});
app.use(otpLimiter);

// ==========================================
//   CAPA 4: DESINFECCIÓN DE DATOS (Anti-NoSQL)
// ==========================================
// Tu propio guardia de seguridad hecho a mano (ya no usamos express-mongo-sanitize)
const sanitizarDatos = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (key.includes('$')) {
          delete obj[key];
        } else if (typeof obj[key] === 'string') {
          obj[key] = obj[key].replace(/\$/g, '_');
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      });
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }
  next();
};
app.use(sanitizarDatos);

// ==========================================
//             RUTAS DE LA API REST
// ==========================================
app.use("/api/productos", require("./routes/productoRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/pedidos", require("./routes/pedidoRoutes"));
app.use("/api/marcas", require("./routes/marcas"));

// RUTAS DE LA API
app.use('/api/resenas', require('./routes/resenaRoutes'));

app.listen(PORT, () => {
  console.log(`Servidor corriendo de forma exitosa en el puerto ${PORT}`);
});