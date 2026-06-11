//archivo: backend/routes/pedidoRoutes.js
// aqui definimos las rutas relacionadas con los pedidos,
// como hacer una compra y ver el historial de compras del usuario logueado.
// Estas rutas están protegidas por el middleware de autenticación
// para asegurar que solo los usuarios autenticados puedan acceder a ellas.

const express = require("express");
const router = express.Router();
const pedidoController = require("../controllers/pedidoController");
const auth = require("../middleware/auth");

// IMPORTAMOS MULTER (El mismo guardia que sube la ropa)
// Ojo: Asegúrate de que esta ruta apunte a tu archivo de configuración de Multer
const upload = require("../config/cloudinary"); // O como se llame tu archivo

// POST /api/pedidos
// Le decimos a Multer que espere un archivo llamado 'comprobante'
router.post(
  "/",
  upload.single('comprobante'), // ¡MAGIA! Multer atrapa la foto aquí
  pedidoController.crearPedido
);

// GET /api/pedidos/mis-pedidos
router.get(
  "/mis-pedidos",
  auth.verificarToken,
  pedidoController.obtenerMisPedidos
);
// --- NUEVA RUTA ADMIN: VER TODOS LOS PEDIDOS ---
router.get(
  "/admin/todos",
  auth.verificarToken, 
  auth.verificarAdmin, // <-- ¡Nadie que no sea admin pasa de aquí!
  pedidoController.obtenerTodosLosPedidos
);
// --- NUEVA RUTA ADMIN: ACTUALIZAR ESTADO DEL PEDIDO ---
router.put(
  "/admin/:id/estado",
  auth.verificarToken,
  auth.verificarAdmin, // <-- ¡Blindaje activo!
  pedidoController.actualizarEstadoPedido
);

// --- NUEVA RUTA ADMIN: VER MIS VENTAS (PEDIDOS DONDE SOY EL VENDEDOR) ---
router.get('/mis-ventas', auth.verificarToken, pedidoController.obtenerVentasMarca);

// La ruta de actualizar estado ahora acepta una foto opcional
router.put('/:id/estado', auth.verificarToken, upload.single('fotoEnvio'), pedidoController.actualizarEstadoPedido);

module.exports = router;
