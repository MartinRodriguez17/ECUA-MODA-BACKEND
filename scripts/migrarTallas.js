require('dotenv').config();
const mongoose = require('mongoose');
const Producto = require('../models/Producto');

const migrar = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conectado a MongoDB ✅');

  const productos = await Producto.find();
  let actualizados = 0;

  for (const producto of productos) {
    // Solo migramos los que tienen tallas en formato viejo (strings)
    if (producto.tallas.length > 0 && typeof producto.tallas[0] === 'string') {
      const tallasNuevas = producto.tallas.map(talla => ({
        talla: talla,
        stock: 5 // stock por defecto, puedes cambiarlo
      }));

      await Producto.findByIdAndUpdate(producto._id, { tallas: tallasNuevas });
      actualizados++;
      console.log(`✅ Migrado: ${producto.nombre}`);
    }
  }

  console.log(`\n🎉 Migración completa: ${actualizados} productos actualizados`);
  mongoose.disconnect();
};

migrar().catch(console.error);