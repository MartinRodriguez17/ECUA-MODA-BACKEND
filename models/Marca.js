// Archivo: models/Marca.js
// aquí definimos el modelo de Marca, que representa a las marcas que se registran en el Hub.
// Este modelo se conecta con la base de datos MongoDB a través de Mongoose y define los campos que tendrá cada marca, 
// como el nombre, el RUC, la identificación, el Instagram, el correo, la contraseña y el estado de aprobación.
const mongoose = require("mongoose");

const MarcaSchema = mongoose.Schema({
  nombreMarca: {
    type: String,
    required: true,
    trim: true,
  },
  ruc: {
    type: String,
    required: true,
    unique: true, // No se pueden duplicar RUCs en el Hub
    trim: true,
  },
  identificacion: {
    // Guardamos Cédula (10) o RUC (13)
    type: String,
    required: true,
    trim: true,
  },
  instagram: {
    type: String,
    required: true,
    trim: true,
  },
  correo: {
    type: String,
    required: true,
    unique: true, // ¡Vital! No pueden haber dos marcas con el mismo correo
  },
  password: {
    type: String,
    required: true,
  },
  fotoUrl: {                    // 👈 NUEVO
    type: String,
    default: '',
  },
  estadoAprobacion: {
    type: String,
    default: 'Pendiente',
  },
  estadoCuenta: {
    type: String,
    enum: ['activo', 'bloqueado', 'suspendido', 'baneado'],
    default: 'activo',
  },
  suspendidoHasta: {
    type: Date,
    default: null,
  },
  motivoEstado: {
    type: String,
    default: '',
  },
  correoBaneado: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Marca", MarcaSchema);
