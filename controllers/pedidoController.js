// controllers/pedidoController.js
// Aquí vamos a manejar todo lo relacionado con los pedidos, 
// como crear un nuevo pedido o mostrar los pedidos de un cliente específico

// Importamos el modelo de Pedido para poder crear nuevos pedidos y buscar los existentes
const Pedido = require('../models/Pedido');
// Importamos el modelo de Producto para verificar que los productos en el pedido existan y tengan stock
const Producto = require('../models/Producto');
// Importamos Cloudinary para manejar las imágenes de los productos (si es necesario)
const cloudinary = require("cloudinary").v2;
// Importamos las funciones para enviar correos relacionados con los pedidos
const {
  enviarCorreoAprobacion,
  enviarCorreoRechazo,
  enviarCorreoEntregado
} = require('../utils/emailService');

exports.crearPedido = async (req, res) => {
  try {
    const appToken = req.headers['x-app-source'];
    if (appToken !== process.env.APP_SECRET_TOKEN) {
      return res.status(401).json({ msg: 'Petición rechazada, usa la app oficial bro 🛑' });
    }

    if (!req.file) {
      return res.status(400).json({ msg: 'Bro, tienes que adjuntar la captura del depósito 📸' });
    }

    const urlComprobante = req.file.path;

    const { productos, subtotal, iva, total, correoComprador, direccionEnvio, telefonoComprador } = req.body;

    if (!correoComprador || !direccionEnvio || !telefonoComprador || !productos) {
      return res.status(400).json({ msg: 'Faltan datos de envío o productos 📦' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correoComprador)) {
      return res.status(400).json({ msg: 'El formato del correo es inválido bro 🛑' });
    }

    const telefonoRegex = /^0\d{9}$/;
    if (!telefonoRegex.test(telefonoComprador)) {
      return res.status(400).json({ msg: 'El teléfono debe tener 10 números y empezar con 0 bro 📱' });
    }

    // 1. Parseamos los productos
    const productosParseados = JSON.parse(productos);
    const productosMapeados = productosParseados.map(item => ({
      producto: item.productoId,
      cantidad: item.cantidad,
      talla: item.talla,
      precio: item.precio
    }));

    // 2. Guardamos el pedido
    const pedido = new Pedido({
      productos: productosMapeados,
      subtotal: Number(subtotal),
      iva: Number(iva),
      total: Number(total),
      correoComprador,
      direccionEnvio,
      telefonoComprador,
      comprobantePagoUrl: urlComprobante
    });

    // --- VERIFICAR QUE EL CLIENTE NO ESTÉ BLOQUEADO ---
    const Usuario = require('../models/Usuario');
    const clienteLogueado = await Usuario.findOne({ email: correoComprador.toLowerCase() });

    if (clienteLogueado) {
      if (clienteLogueado.estadoCuenta === 'bloqueado') {
        return res.status(403).json({
          msg: 'Tu cuenta está bloqueada. No puedes realizar compras 🔒'
        });
      }
      if (clienteLogueado.estadoCuenta === 'suspendido') {
        return res.status(403).json({
          msg: 'Tu cuenta está suspendida. No puedes realizar compras 🔴'
        });
      }
      if (clienteLogueado.estadoCuenta === 'baneado') {
        return res.status(403).json({
          msg: 'Tu cuenta ha sido eliminada 🚫'
        });
      }
    }
    await pedido.save();

    // 3. Reducimos el stock DESPUÉS de guardar
    for (const item of productosMapeados) {
      await Producto.findOneAndUpdate(
        { _id: item.producto, 'tallas.talla': item.talla },
        { $inc: { 'tallas.$.stock': -item.cantidad } }
      );
    }

    res.status(201).json({ msg: '¡Pedido recibido! Validaremos tu pago en breve 🏦', pedido });

  } catch (error) {
    console.error('Error al crear el pedido:', error);
    res.status(500).json({ msg: 'Hubo un error al procesar la compra bro' });
  }
}

exports.obtenerMisPedidos = async (req, res) => {
  try {
    const Usuario = require("../models/Usuario");
    const usuarioLogueado = await Usuario.findById(req.usuario.id);
    if (!usuarioLogueado) {
      return res.status(404).json({ msg: "Usuario no encontrado bro 🛑" });
    }

    const pedidos = await Pedido.find({ correoComprador: usuarioLogueado.email })
      .populate({
        path: 'productos.producto',
        select: 'nombre marcaId marcaNombre imagenes precio', // 👈 traemos marcaId
      })
      .sort({ fechaCreacion: -1 });

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
    const { estado, motivoRechazo, numeroRastreo } = req.body;
    const pedidoId = req.params.id;

    const pedido = await Pedido.findById(pedidoId);
    if (!pedido) {
      return res.status(404).json({ msg: 'Pedido no encontrado bro 🛑' });
    }

    // Subimos foto de envío si la mandan
    let fotoEnvioUrl = null;
    if (req.file) {
      fotoEnvioUrl = req.file.path;
    }

    await Pedido.findByIdAndUpdate(pedidoId, { estado }, { new: true });

    // Enviamos correo según el estado
    if (estado === 'Aprobado') {
      await enviarCorreoAprobacion(pedido.correoComprador, numeroRastreo, fotoEnvioUrl);
    } else if (estado === 'Rechazado') {
      await enviarCorreoRechazo(pedido.correoComprador, motivoRechazo || 'No especificado');
    } else if (estado === 'Entregado') {
      await enviarCorreoEntregado(pedido.correoComprador);
    }

    res.json({ msg: `¡Pedido ${estado} con éxito! 🔥` });

  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ msg: 'Hubo un error al actualizar el pedido' });
  }
};

exports.obtenerVentasMarca = async (req, res) => {
  try {
    const pedidos = await Pedido.find()
      .populate({
        path: 'productos.producto',
        select: 'nombre precio marcaId imagenes',
      })
      .sort({ fechaCreacion: -1 });

    // Filtramos solo los productos que pertenecen a esta marca
    const ventasDeMiMarca = pedidos
      .map(pedido => {
        const misItems = pedido.productos.filter(
          item => item.producto?.marcaId?.toString() === req.usuario.id
        );
        if (misItems.length === 0) return null;
        return {
          _id: pedido._id,
          estado: pedido.estado,
          fechaCreacion: pedido.fechaCreacion,
          correoComprador: pedido.correoComprador,
          direccionEnvio: pedido.direccionEnvio,
          telefonoComprador: pedido.telefonoComprador, 
          comprobantePagoUrl: pedido.comprobantePagoUrl,
          productos: misItems,
          total: misItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0),
        };
      })
      .filter(p => p !== null);

    res.json(ventasDeMiMarca);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ msg: 'Error al obtener tus ventas bro' });
  }
};