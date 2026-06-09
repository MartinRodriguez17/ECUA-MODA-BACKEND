// controllers/pedidoController.js
// Aquí vamos a manejar todo lo relacionado con los pedidos, 
// como crear un nuevo pedido o mostrar los pedidos de un cliente específico

// Importamos el modelo de Pedido para poder crear nuevos pedidos y buscar los existentes
const Pedido = require('../models/Pedido');
// Importamos el modelo de Producto para verificar que los productos en el pedido existan y tengan stock
const Producto = require('../models/Producto');
// Importamos Cloudinary para manejar las imágenes de los productos (si es necesario)
const cloudinary = require("cloudinary").v2;

exports.crearPedido = async (req, res) => {
    try {
        const appToken = req.headers['x-app-source'];
        if (appToken !== process.env.APP_SECRET_TOKEN) {
            return res.status(401).json({ msg: 'Petición rechazada, usa la app oficial bro 🛑' });
        }

        // 1. Multer nos deja la imagen aquí si todo salió bien
        if (!req.file) {
            return res.status(400).json({ msg: 'Bro, tienes que adjuntar la captura del depósito 📸' });
        }

        const urlComprobante = req.file.path; // ¡Bingo! Link de Cloudinary

        // 2. Extraemos los textos que vienen en el FormData
        const { productos, subtotal, iva, total, correoComprador, direccionEnvio, telefonoComprador } = req.body;

        if (!correoComprador || !direccionEnvio || !telefonoComprador || !productos) {
            return res.status(400).json({ msg: 'Faltan datos de envío o productos 📦' });
        }

        // --- EL BLINDAJE BACKEND (REGEX) ---
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correoComprador)) {
            return res.status(400).json({ msg: 'El formato del correo es inválido bro 🛑' });
        }

        const telefonoRegex = /^0\d{9}$/; 
        if (!telefonoRegex.test(telefonoComprador)) {
            return res.status(400).json({ msg: 'El teléfono debe tener 10 números y empezar con 0 bro 📱' });
        }

        // 3. Parseamos los productos (viajan como texto JSON en FormData)
        const productosParseados = JSON.parse(productos);
        
        const productosMapeados = productosParseados.map(item => ({
            producto: item.productoId, 
            cantidad: item.cantidad,
            talla: item.talla,
            precio: item.precio
        }));

        // 4. Guardamos el pedido
        const pedido = new Pedido({
            productos: productosMapeados,
            subtotal: Number(subtotal),
            iva: Number(iva),
            total: Number(total),
            correoComprador,
            direccionEnvio,
            telefonoComprador,
            comprobantePagoUrl: urlComprobante // Guardamos el link de Cloudinary
        });

        await pedido.save();

        res.status(201).json({ msg: '¡Pedido recibido! Validaremos tu pago en breve 🏦', pedido });

    } catch (error) {
        console.error('Error al crear el pedido:', error);
        res.status(500).json({ msg: 'Hubo un error al procesar la compra bro' });
    }
}

exports.obtenerMisPedidos = async (req, res) => {
  try {
    // 1. Buscamos el correo real del usuario logueado usando su ID del token
    const Usuario = require("../models/Usuario"); 
    const usuarioLogueado = await Usuario.findById(req.usuario.id);

    if (!usuarioLogueado) {
      return res.status(404).json({ msg: "Usuario no encontrado bro 🛑" });
    }

    // 2. Buscamos todos los pedidos donde el correoComprador sea igual al del usuario
    const pedidos = await Pedido.find({ correoComprador: usuarioLogueado.email }).sort({ fechaCreacion: -1 });
    
    res.json(pedidos);
  } catch (error) {
    console.error("Error al obtener mis pedidos:", error);
    res.status(500).json({ msg: "Hubo un error al buscar tus compras" });
  }
};

// --- FUNCIÓN (ADMIN): VER ABSOLUTAMENTE TODOS LOS PEDIDOS ---
exports.obtenerTodosLosPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.find()
      // MAGIA NIVEL DIOS: Traemos la ropa Y TAMBIÉN los datos del dueño de la marca
      .populate({
        path: 'productos.producto',
        select: 'nombre marcaNombre precio marcaId',
        populate: {
          path: 'marcaId', // Viajamos al modelo de Usuario
          select: 'email' // Traemos el correo para contactarlos/pagarles por PayPal (o transferencia)
        }
      })
      .sort({ fechaCreacion: -1 });
      
    res.json(pedidos);
  } catch (error) {
    console.error("Error al obtener todos los pedidos:", error);
    res.status(500).json({ msg: "Hubo un error al cargar el panel bro" });
  }
};

// --- NUEVA FUNCIÓN (ADMIN): ACTUALIZAR EL ESTADO DEL PEDIDO ---
exports.actualizarEstadoPedido = async (req, res) => {
  try {
    const { estado } = req.body; // Recibiremos "Aprobado", "Rechazado", etc.
    const pedidoId = req.params.id; // El ID viaja en la URL

    const pedidoActualizado = await Pedido.findByIdAndUpdate(
      pedidoId,
      { estado: estado },
      { new: true }
    );

    if (!pedidoActualizado) {
      return res.status(404).json({ msg: "Pedido no encontrado bro 🛑" });
    }

    res.json({ msg: `¡Pedido ${estado} con éxito! 🔥`, pedido: pedidoActualizado });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ msg: "Hubo un error al actualizar el pedido" });
  }
};