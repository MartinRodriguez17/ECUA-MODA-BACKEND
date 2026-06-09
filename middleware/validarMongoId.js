// Archivo: middlewares/validarMongoId.js
// Este middleware se encarga de validar que el ID que viene en la URL tenga el
//  formato correcto de MongoDB (24 caracteres hexadecimales). Si el ID no es válido,
// responde con un error 400.
const mongoose = require("mongoose");

const validarMongoId = (req, res, next) => {
  const { id } = req.params; // Sacamos el ID que viene en la URL (ej: /api/productos/123)

  // Si hay un ID en la ruta, pero no tiene el formato matemático de MongoDB...
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ msg: "Ese ID no es válido bro, no rompas el server 🛑" });
  }

  // Si el ID es perfecto (o si no mandaron ID), le decimos "Pasa, todo en orden"
  next();
};

module.exports = validarMongoId;
