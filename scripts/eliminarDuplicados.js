require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Marca = require('../models/Marca');

const eliminarDuplicados = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conectado a MongoDB ✅');

  // Buscamos todos los correos que están en Marca
  const marcas = await Marca.find().select('correo nombreMarca');
  console.log(`Marcas encontradas: ${marcas.length}`);

  let eliminados = 0;

  for (const marca of marcas) {
    const correo = marca.correo?.toLowerCase();
    if (!correo) continue;

    // Buscamos si existe ese correo también como cliente
    const usuarioDuplicado = await Usuario.findOne({ email: correo });

    if (usuarioDuplicado) {
      await Usuario.findByIdAndDelete(usuarioDuplicado._id);
      console.log(`✅ Eliminado duplicado: ${correo} (era cliente Y marca "${marca.nombreMarca}")`);
      eliminados++;
    }
  }

  console.log(`\n🎉 Listo: ${eliminados} cuenta(s) duplicada(s) eliminada(s)`);
  mongoose.disconnect();
};

eliminarDuplicados().catch(console.error);