// Archivo: backend/models/Producto.js
// Este archivo define el modelo de datos para los productos que se van a vender en el Hub de Moda.
// Aquí usamos Mongoose para crear un esquema que luego se convertirá en una colección en MongoDB.
// Archivo: backend/models/Producto.js
const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    // --- LOS NUEVOS CAMPOS MULTIMARCA (Reemplazan al campo 'marca' viejo) ---
    marcaNombre: {
      type: String,
      required: true,
      default: 'Hub Moda'
    },
    marcaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    precio: {
      type: Number,
      required: true,
    },
    fit: {
      type: String,
      enum: ["oversize", "baggy", "regular", "slim", "crop"],
      default: "regular",
    },
    estilo: {
      type: String,
      required: true,
    },
    oculto: {
      type: Boolean,
      default: false,
    },
    tallas: [
      {
        talla: {
          type: String,
          enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
          required: true,
        },
        stock: {
          type: Number,
          default: 0,
        }
      }
    ],
    imagenes: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Producto", productoSchema);