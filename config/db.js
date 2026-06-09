// Este archivo se encarga de conectar tu aplicación a la base de datos MongoDB usando Mongoose.
// Aquí es donde jala el link de conexión que guardaste en tu .env,
//  y se asegura de que la conexión sea exitosa o maneja errores si algo sale mal.

const mongoose = require('mongoose');

const conectarDB = async () => {
    try {
        // Aquí jala el link que guardaste en el .env
        await mongoose.connect(process.env.MONGO_URI);
        console.log('¡Base de datos conectada con éxito, bro! 🚀');
    } catch (error) {
        console.log('Hubo un error conectando a la base de datos:', error);
        process.exit(1); // Esto detiene la app si hay un error fatal
    }
};

module.exports = conectarDB;