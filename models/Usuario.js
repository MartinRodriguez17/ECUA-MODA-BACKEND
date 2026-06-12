// aqui definimos el modelo de usuario, con sus campos y validaciones. 
// Este modelo se usará para crear, leer, actualizar y eliminar usuarios en la base de datos MongoDB.

const mongoose = require('mongoose');

const UsuarioSchema = mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  rol: {
    type: String,
    default: 'cliente'
  },
  fechaRegistro: {
    type: Date,
    default: Date.now
  },
  fotoUrl: {
    type: String,
    default: ''
  },

  // --- ESTADO DE CUENTA ---
  estadoCuenta: {
    type: String,
    enum: ['activo', 'bloqueado', 'suspendido', 'baneado'],
    default: 'activo',
  },

  // --- SUSPENSIÓN TEMPORAL ---
  suspendidoHasta: {
    type: Date,
    default: null,
  },
  motivoEstado: {
    type: String,
    default: '',
  },

  // --- CORREOS BANEADOS (para evitar re-registro) ---
  correoBaneado: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
