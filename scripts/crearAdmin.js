require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

const crearAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conectado a MongoDB ✅');

  // Verifica si ya existe este usuario específico
  const adminExistente = await Usuario.findOne({ nombre: 'admin_hub' });
  if (adminExistente) {
    console.log('⚠️ El admin ya existe');
    mongoose.disconnect();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Admin2024#', salt); // 👈 cambia esta contraseña

  const admin = new Usuario({
    nombre: 'admin_hub',           // 👈 cambia este usuario
    email: 'admin_hub@hubmoda.com',
    password: passwordHash,
    rol: 'admin',
  });

  await admin.save();
  console.log('✅ Admin creado con éxito');
  console.log('   Usuario: admin_hub');
  console.log('   Contraseña: Admin2024#');
  mongoose.disconnect();
};

crearAdmin().catch(console.error);