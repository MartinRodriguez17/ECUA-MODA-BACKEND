// Archivo: controllers/marcaController.js
// Aquí definimos la lógica para manejar las solicitudes relacionadas con las marcas,
// como el registro de nuevas marcas. Esta lógica se conecta con el modelo Marca
// para interactuar con la base de datos MongoDB.
// Archivo: controllers/marcaController.js
const Marca = require("../models/Marca");
const bcrypt = require("bcryptjs");
// Importamos el súper validador de RUC que hicimos
const { validarRucEcuador } = require("../utils/validadorRUC");

const Otp = require("../models/Otp"); // <-- NUEVO
const {
  enviarCorreoBienvenida,
  enviarCorreoOTP,
} = require("../utils/emailService");
// --- FUNCIÓN MATEMÁTICA: Módulo 10 SOLO para Cédula ---
// Esta la dejamos solo para validar la cédula del representante
const validarCedulaEcuatoriana = (cedula) => {
  if (!cedula || typeof cedula !== "string" || cedula.length !== 10)
    return false;

  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;

  const tercerDigito = parseInt(cedula[2], 10);
  if (tercerDigito >= 6) return false;

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula[i], 10) * coeficientes[i];
    if (valor > 9) valor -= 9;
    suma += valor;
  }

  let digitoEsperado = 10 - (suma % 10);
  if (digitoEsperado === 10) digitoEsperado = 0;

  return digitoEsperado === parseInt(cedula[9], 10);
};

// --- NUEVO: Generar y enviar código OTP ---
exports.generarOtp = async (req, res) => {
  try {
    const correo = req.body.correo?.trim().toLowerCase();
    if (!correo) return res.status(400).json({ msg: "Falta el correo bro" });

    // Verificamos que el correo no esté ya registrado en las marcas
    const marcaExistente = await Marca.findOne({ correo });
    if (marcaExistente) {
      return res.status(400).json({ msg: "Este correo ya está registrado" });
    }

    // 1. Generamos un código de 6 dígitos al azar
    const codigoGenerado = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    // 2. Borramos si había un código anterior para este correo (para no acumular basura)
    await Otp.deleteMany({ correo });

    // 3. Guardamos el nuevo código en Mongo
    const nuevoOtp = new Otp({ correo, codigo: codigoGenerado });
    await nuevoOtp.save();

    // 4. Se lo mandamos por email
    await enviarCorreoOTP(correo, codigoGenerado);

    res.status(200).json({ msg: "Código enviado al correo 🚀" });
  } catch (error) {
    console.error("Error OTP:", error);
    res.status(500).send("Hubo un error al generar el código");
  }
};
exports.solicitarRegistroMarca = async (req, res) => {
  try {
    const nombreMarca = req.body.nombreMarca?.trim();
    const ruc = req.body.ruc?.trim(); // Nuevo campo obligatorio
    const cedulaRepresentante = req.body.identificacion?.trim(); // Lo que antes era 'identificacion'
    const instagram = req.body.instagram?.trim();
    const correo = req.body.correo?.trim().toLowerCase();
    const password = req.body.password?.trim();
    const codigoOtp = req.body.codigoOtp?.trim();

    const appToken = req.headers["x-app-source"];
    if (appToken !== process.env.APP_SECRET_TOKEN) {
      return res
        .status(401)
        .json({ msg: "Petición rechazada, usa la app oficial bro 🛑" });
    }

    // Actualizamos la validación para pedir RUC y Cédula
    if (
      !nombreMarca ||
      !ruc ||
      !cedulaRepresentante ||
      !instagram ||
      !correo ||
      !password
    ) {
      return res
        .status(400)
        .json({ msg: "Todos los campos son obligatorios para las marcas 🛑" });
    }

    if (/[<>]/.test(nombreMarca)) {
      return res
        .status(400)
        .json({
          msg: "Ese nombre tiene caracteres no permitidos bro, nada de hacks 🛡️",
        });
    }

    if (!instagram.startsWith("@")) {
      return res
        .status(400)
        .json({ msg: "El Instagram debe empezar con @ bro 📸" });
    }

    // --- NUEVAS VALIDACIONES LEGALES ---
    // 1. Validamos la Cédula
    if (!validarCedulaEcuatoriana(cedulaRepresentante)) {
      return res
        .status(400)
        .json({
          msg: "La cédula del representante no es válida matemáticamente 🛑",
        });
    }
    // 2. Validamos el RUC usando el archivo de utils
    if (!validarRucEcuador(ruc)) {
      return res
        .status(400)
        .json({ msg: "El RUC de la empresa no es válido en Ecuador 🛑" });
    }

    // --- NUEVO: VALIDAMOS EL CÓDIGO OTP ---
    if (!codigoOtp) {
      return res.status(400).json({ msg: "Falta el código de verificación bro 🛑" });
    }

    const otpGuardado = await Otp.findOne({ correo: correo.toLowerCase(), codigo: codigoOtp });
    
    if (!otpGuardado) {
      return res.status(400).json({ msg: "Código incorrecto o ya expiró (duraba 5 min) ⏳" });
    }

    // ... (aquí sigue tu código normal: encriptar contraseña, guardar nuevaMarca, etc) ...

    // Y justo antes del res.status(201), destruyes el código para que no se re-use
    await Otp.deleteOne({ _id: otpGuardado._id });

    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(correo)) {
      return res
        .status(400)
        .json({ msg: "El formato del correo es inválido 🛑" });
    }

    const passRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passRegex.test(password)) {
      return res
        .status(400)
        .json({
          msg: "La contraseña es muy débil bro, métele mayúsculas y números 🔒",
        });
    }

    // Verificamos que el correo O EL RUC no estén registrados ya
    let marcaExistente = await Marca.findOne({
      $or: [{ correo: correo }, { ruc: ruc }],
    });

    if (marcaExistente) {
      return res
        .status(400)
        .json({
          msg: "Este correo o RUC ya tiene una solicitud activa en el Hub",
        });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHasheado = await bcrypt.hash(password, salt);

    // Guardamos la marca con los dos campos separados
    const nuevaMarca = new Marca({
      nombreMarca,
      ruc, // Nuevo
      identificacion: cedulaRepresentante, // Guardamos la cédula aquí
      instagram,
      correo: correo,
      password: passwordHasheado,
    });

    await nuevaMarca.save();

    // Enviar correo de bienvenida
    enviarCorreoBienvenida(correo, nombreMarca);

    res.status(201).json({
      msg: "¡Solicitud de marca enviada con éxito! Queda en estado Pendiente 🏢",
      marca: {
        _id: nuevaMarca._id,
        nombreMarca: nuevaMarca.nombreMarca,
        ruc: nuevaMarca.ruc,
        estadoAprobacion: nuevaMarca.estadoAprobacion,
      },
    });
  } catch (error) {
    console.error("Error registrar marca:", error.message);
    res.status(500).send("Hubo un error en el servidor bro");
  }
};
