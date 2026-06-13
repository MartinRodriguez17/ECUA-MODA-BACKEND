const mongoose = require('mongoose');

const ResenaSchema = mongoose.Schema({
  marcaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Marca',
    required: true,
  },
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  pedidoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pedido',
    required: true,
  },
  estrellas: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comentario: {
    type: String,
    default: '',
    maxlength: 300,
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
});

// Un cliente solo puede reseñar una vez por pedido
ResenaSchema.index({ pedidoId: 1, clienteId: 1 }, { unique: true });

module.exports = mongoose.model('Resena', ResenaSchema);