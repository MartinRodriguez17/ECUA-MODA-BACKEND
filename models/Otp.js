// Archivo: models/Otp.js
// Este modelo es para guardar los códigos OTP (One-Time Password) 
// que se envían a los usuarios para verificar su correo o para recuperar su contraseña.
// Cada documento de OTP tiene un campo de correo, un código generado y una fecha de creación.
//  Además, gracias a la propiedad "expires" en el esquema, 
// MongoDB eliminará automáticamente el documento después de 5 minutos (300 segundos), 
// lo que garantiza que los códigos OTP no se queden dando vueltas por ahí para siempre.
const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
  correo: {
    type: String,
    required: true,
  },
  codigo: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // MAGIA: Este documento se borra solo de Mongo después de 300 segundos (5 min)
  },
});

module.exports = mongoose.model("Otp", OtpSchema);