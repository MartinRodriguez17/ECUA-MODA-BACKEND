require('dotenv').config();
const mongoose = require('mongoose');
const Producto = require('../models/Producto');

const migrar = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conectado a MongoDB ✅');

  const productos = await Producto.find();
  let actualizados = 0;

  for (const producto of productos) {
    const actualizaciones = {};

    if (!producto.descripcion) actualizaciones.descripcion = '';
    if (!producto.categoria) actualizaciones.categoria = '';
    if (!producto.genero) actualizaciones.genero = '';
    if (!producto.marca) actualizaciones.marca = producto.marcaNombre || '';

    if (Object.keys(actualizaciones).length > 0) {
      await Producto.findByIdAndUpdate(producto._id, { $set: actualizaciones });
      console.log(`✅ Migrado: ${producto.nombre}`);
      actualizados++;
    }
  }

  console.log(`\n🎉 Migración completa: ${actualizados} productos actualizados`);
  mongoose.disconnect();
};

migrar().catch(console.error);