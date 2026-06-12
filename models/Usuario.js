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
        unique: true, // ¡Súper importante! Evita que se registren dos veces con el mismo correo
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    rol: {
        type: String,
        default: 'cliente' // Por defecto, el que se registre será un cliente normal
    },
    fechaRegistro: {
        type: Date,
        default: Date.now
    },

    fotoUrl: {
        type: String,
        default: "" // Por defecto vacío hasta que suban una foto
    },
    estadoCuenta: {
        type: String,
        enum: ['activo', 'suspendido', 'baneado'],
        default: 'activo',
    },
});

module.exports = mongoose.model('Usuario', UsuarioSchema);