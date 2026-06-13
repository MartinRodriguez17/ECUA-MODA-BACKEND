const Resena = require('../models/Resena');
const Marca = require('../models/Marca');
const Pedido = require('../models/Pedido');
const Usuario = require('../models/Usuario');

// --- CREAR RESEÑA ---
exports.crearResena = async (req, res) => {
  try {
    const { marcaId, pedidoId, estrellas, comentario } = req.body;
    const clienteId = req.usuario.id;

    // Verificar que el pedido existe y está entregado
    const pedido = await Pedido.findById(pedidoId);
    if (!pedido) return res.status(404).json({ msg: 'Pedido no encontrado' });
    if (pedido.estado !== 'Entregado') {
      return res.status(400).json({ msg: 'Solo puedes calificar pedidos entregados 🛑' });
    }

    // Verificar que el cliente es el dueño del pedido
    const cliente = await Usuario.findById(clienteId);
    if (pedido.correoComprador !== cliente.email) {
      return res.status(403).json({ msg: 'Este pedido no es tuyo bro 🛑' });
    }

    // Verificar que no haya calificado ya este pedido
    const resenaExistente = await Resena.findOne({ pedidoId, clienteId });
    if (resenaExistente) {
      return res.status(400).json({ msg: 'Ya calificaste este pedido bro ⭐' });
    }

    const nuevaResena = new Resena({
      marcaId,
      clienteId,
      pedidoId,
      estrellas,
      comentario: comentario?.trim() || '',
    });

    await nuevaResena.save();

    // Actualizamos el promedio de la marca
    const todasLasResenas = await Resena.find({ marcaId });
    const promedio = todasLasResenas.reduce((sum, r) => sum + r.estrellas, 0) / todasLasResenas.length;

    await Marca.findByIdAndUpdate(marcaId, {
      calificacionPromedio: Math.round(promedio * 10) / 10,
      totalResenas: todasLasResenas.length,
    });

    res.status(201).json({ msg: '¡Gracias por tu calificación! ⭐', resena: nuevaResena });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ msg: 'Ya calificaste este pedido bro ⭐' });
    }
    console.error('Error al crear reseña:', error);
    res.status(500).json({ msg: 'Error al guardar la reseña bro' });
  }
};

// --- OBTENER RESEÑAS DE UNA MARCA ---
exports.obtenerResenasMarca = async (req, res) => {
  try {
    const { marcaId } = req.params;
    const resenas = await Resena.find({ marcaId })
      .populate('clienteId', 'nombre fotoUrl')
      .sort({ fechaCreacion: -1 });

    res.json(resenas);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ msg: 'Error al obtener reseñas bro' });
  }
};

// --- VERIFICAR SI EL CLIENTE YA CALIFICÓ UN PEDIDO ---
exports.verificarResena = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const clienteId = req.usuario.id;
    const resena = await Resena.findOne({ pedidoId, clienteId });
    res.json({ yaCalifico: !!resena, resena });
  } catch (error) {
    res.status(500).json({ msg: 'Error bro' });
  }
};