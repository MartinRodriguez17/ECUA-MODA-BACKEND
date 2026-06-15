// Archivo: backend/controllers/authController.js
// aqui vamos a manejar todo lo relacionado con el registro y login de usuarios

const Marca = require("../models/Marca");
const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Otp = require("../models/Otp");
const { enviarCorreoOTP, enviarCorreoSancion, enviarCorreoAceptacionMarca } = require('../utils/emailService');

// --- GENERAR OTP PARA CLIENTES ---
exports.generarOtpUsuario = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const nombre = req.body.nombre?.trim();

    if (!email) return res.status(400).json({ msg: "Falta el correo bro" });

    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ msg: "Bro, este correo ya tiene una cuenta activa" });
    }

    const marcaExistente = await Marca.findOne({ correo: email });
    if (marcaExistente) {
      return res.status(400).json({ msg: "Este correo ya está registrado como vendedor bro 🛑" });
    }

    if (nombre) {
      const usernameRepetido = await Usuario.findOne({ nombre: new RegExp(`^${nombre}$`, 'i') });
      if (usernameRepetido) {
        return res.status(400).json({ msg: "Ese nombre de usuario ya está reclamado, intenta con otro bro 🏃‍♂️" });
      }
    }

    const codigoGenerado = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ correo: email });
    const nuevoOtp = new Otp({ correo: email, codigo: codigoGenerado });
    await nuevoOtp.save();

    await enviarCorreoOTP(email, codigoGenerado);
    res.status(200).json({ msg: "Código enviado al correo 🚀" });
  } catch (error) {
    console.error("Error OTP Usuario:", error);
    res.status(500).send("Hubo un error al generar el código");
  }
};

// --- REGISTRAR USUARIO ---
exports.registrarUsuario = async (req, res) => {
  try {
    const { nombre, email, password, codigoOtp } = req.body;

    if (!nombre || !email || !password || !codigoOtp) {
      return res.status(400).json({ msg: "Bro, faltan datos o el código de verificación 🛑" });
    }

    if (/[<>]/.test(nombre)) {
      return res.status(400).json({ msg: "Nada de hacks en el nombre, bro 🛡️" });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        msg: "Bro, la contraseña debe tener al menos 8 caracteres, una letra mayúscula y un número 🛑",
      });
    }

    const otpGuardado = await Otp.findOne({ correo: email.toLowerCase(), codigo: codigoOtp });
    if (!otpGuardado) {
      return res.status(400).json({ msg: "Código incorrecto o ya expiró (duraba 5 min) ⏳" });
    }

    await Otp.deleteOne({ _id: otpGuardado._id });

    let usuario = await Usuario.findOne({ email: email.toLowerCase() });
    if (usuario) {
      return res.status(400).json({ msg: "Bro, este correo ya está registrado" });
    }

    usuario = new Usuario({
      nombre,
      email: email.toLowerCase(),
      password,
    });

    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(password, salt);

    await usuario.save();

    const payload = {
      usuario: {
        id: usuario.id,
        rol: usuario.rol,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "30d" },
      (error, token) => {
        if (error) throw error;
        res.status(201).json({
          msg: "¡Usuario creado con éxito y sesión iniciada! 🛡️",
          token,
        });
      },
    );
  } catch (error) {
    console.log("Error en el registro:", error);
    res.status(500).send("Hubo un error al registrar al usuario bro");
  }
};

// --- INICIAR SESIÓN (CORREGIDO) ---
exports.loginUsuario = async (req, res) => {
  const { email, password } = req.body;

  try {
    let esMarca = false;
    const correoNormalizado = email.toLowerCase();

    // 1. Buscamos primero en la colección de clientes normales
    let usuario = await Usuario.findOne({ email: correoNormalizado });

    // 2. Si no lo encuentra, buscamos en la colección de marcas
    if (!usuario) {
      usuario = await Marca.findOne({ correo: correoNormalizado });

      if (!usuario) {
        return res.status(400).json({ msg: "El usuario o marca no existe bro" });
      }

      if (usuario.estadoAprobacion !== "Aceptada") {
        return res.status(403).json({
          msg: "Tu marca aún está en revisión bro, espera a que el admin te apruebe 🕒",
        });
      }
      esMarca = true;
    }

    // --- ESCUDO DE SUSPENSIÓN Y BANEO (MOVIDO AQUÍ ADENTRO ANTES DEL TOKEN) ---
    if (usuario && !esMarca) {
      // Verificar si la suspensión expiró
      if (usuario.estadoCuenta === 'suspendido' && usuario.suspendidoHasta) {
        if (new Date() > new Date(usuario.suspendidoHasta)) {
          await Usuario.findByIdAndUpdate(usuario._id, {
            estadoCuenta: 'activo',
            suspendidoHasta: null
          });
        } else {
          const diasRestantes = Math.ceil(
            (new Date(usuario.suspendidoHasta) - new Date()) / (1000 * 60 * 60 * 24)
          );
          return res.status(403).json({
            msg: `Tu cuenta está suspendida. Quedan ${diasRestantes} día(s) para que se reactive 🔴`
          });
        }
      }
    }

    // 3. Comparamos la contraseña
    const passwordCorrecto = await bcrypt.compare(password, usuario.password);
    if (!passwordCorrecto) {
      return res.status(400).json({ msg: "Contraseña incorrecta pana" });
    }

    // 4. Armamos el Pase VIP dinámico
    const payload = {
      usuario: {
        id: usuario.id,
        rol: esMarca ? "marca" : usuario.rol,
      },
    };

    // 5. Entregamos el Token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
      (error, token) => {
        if (error) throw error;
        res.json({ token });
      }
    );

  } catch (error) {
    console.log("Error en el login:", error);
    res.status(500).send("Hubo un error al iniciar sesión");
  }
};

// --- OBTENER PERFIL (ELIMINADO DUPLICADO) ---
exports.obtenerPerfilUsuario = async (req, res) => {
  try {
    const id = req.usuario.id;
    const rol = req.usuario.rol;

    if (rol === 'marca') {
      const marca = await Marca.findById(id).select('-password');
      if (!marca) return res.status(404).json({ msg: 'Usuario no encontrado bro' });

      return res.json({
        _id: marca._id,
        nombre: marca.nombreMarca || marca.nombre,
        email: marca.correo || marca.email,
        rol: 'marca',
        fotoUrl: marca.fotoUrl || '',
      });
    }

    const usuario = await Usuario.findById(id).select('-password');
    if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado bro' });

    res.json(usuario);

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).send('Hubo un error en el servidor al buscar tu perfil');
  }
};

// --- ACTUALIZAR PERFIL ---
exports.actualizarPerfil = async (req, res) => {
  try {
    const { nombre } = req.body;
    const rol = req.usuario.rol;
    const actualizaciones = {};

    if (req.file) {
      actualizaciones.fotoUrl = req.file.path;
    }

    if (rol === 'marca') {
      if (nombre) actualizaciones.nombreMarca = nombre;

      const marcaActualizada = await Marca.findByIdAndUpdate(
        req.usuario.id,
        { $set: actualizaciones },
        { new: true }
      ).select('-password');

      return res.json({
        msg: '¡Perfil actualizado con éxito! 🔥',
        usuario: {
          _id: marcaActualizada._id,
          nombre: marcaActualizada.nombreMarca || marcaActualizada.nombre,
          email: marcaActualizada.correo || marcaActualizada.email,
          rol: 'marca',
          fotoUrl: marcaActualizada.fotoUrl || '',
        }
      });
    }

    if (nombre) {
      const usernameRepetido = await Usuario.findOne({
        nombre: new RegExp(`^${nombre}$`, 'i'),
        _id: { $ne: req.usuario.id }
      });
      if (usernameRepetido) {
        return res.status(400).json({ msg: 'Ese nombre ya está en uso bro 🛑' });
      }
      actualizaciones.nombre = nombre;
    }

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.usuario.id,
      { $set: actualizaciones },
      { new: true }
    ).select('-password');

    res.json({ msg: '¡Perfil actualizado con éxito! 🔥', usuario: usuarioActualizado });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ msg: 'Hubo un error al guardar tus cambios bro' });
  }
};

// --- OTP RECUPERACIÓN ---
exports.generarOtpRecuperacion = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ msg: "Falta el correo bro" });

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ msg: "No existe una cuenta con ese correo" });
    }

    const codigoGenerado = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ correo: email });
    const nuevoOtp = new Otp({ correo: email, codigo: codigoGenerado });
    await nuevoOtp.save();

    await enviarCorreoOTP(email, codigoGenerado);
    res.status(200).json({ msg: "Código enviado al correo 🚀" });

  } catch (error) {
    console.error("Error OTP Recuperación:", error);
    res.status(500).send("Hubo un error al generar el código");
  }
};

// --- RESTABLECER PASSWORD ---
exports.restablecerPassword = async (req, res) => {
  try {
    const { email, codigoOtp, nuevaPassword } = req.body;

    if (!email || !codigoOtp || !nuevaPassword) {
      return res.status(400).json({ msg: "Faltan datos bro 🛑" });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(nuevaPassword)) {
      return res.status(400).json({
        msg: "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número 🛑",
      });
    }

    const otpGuardado = await Otp.findOne({ correo: email.toLowerCase(), codigo: codigoOtp });
    if (!otpGuardado) {
      return res.status(400).json({ msg: "Código incorrecto o ya expiró (duraba 5 min) ⏳" });
    }

    await Otp.deleteOne({ _id: otpGuardado._id });

    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(nuevaPassword, salt);

    await Usuario.findOneAndUpdate(
      { email: email.toLowerCase() },
      { password: passwordEncriptada }
    );

    res.status(200).json({ msg: "¡Contraseña actualizada con éxito! 🎉" });

  } catch (error) {
    console.error("Error al restablecer password:", error);
    res.status(500).send("Hubo un error al restablecer la contraseña");
  }
};

// --- LOGIN ADMIN ---
exports.loginAdmin = async (req, res) => {
  const { nombre, password } = req.body;

  try {
    const admin = await Usuario.findOne({ nombre, rol: 'admin' });

    if (!admin) {
      return res.status(400).json({ msg: 'Credenciales incorrectas' });
    }

    const passwordCorrecto = await bcrypt.compare(password, admin.password);
    if (!passwordCorrecto) {
      return res.status(400).json({ msg: 'Credenciales incorrectas' });
    }

    const payload = { usuario: { id: admin.id, rol: 'admin' } };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' }, (error, token) => {
      if (error) throw error;
      res.json({ token });
    });

  } catch (error) {
    console.log('Error login admin:', error);
    res.status(500).send('Error en el servidor');
  }
};

// --- OBTENER TODOS LOS USUARIOS ---
exports.obtenerTodosUsuarios = async (req, res) => {
  try {
    const clientes = await Usuario.find({ rol: { $ne: 'admin' } }).select('-password');
    const marcas = await Marca.find().select('-password');

    res.json({ clientes, marcas });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ msg: 'Error al obtener usuarios bro' });
  }
};

// --- CAMBIAR ESTADO USUARIO ---
exports.cambiarEstadoUsuario = async (req, res) => {
  try {
    const { estado, motivo, dias } = req.body;
    const { id, tipo } = req.params;

    if (estado === 'activo') {
      if (tipo === 'marca') {
        await Marca.findByIdAndUpdate(id, {
          estadoCuenta: 'activo',
          estadoAprobacion: 'Aceptada',
          suspendidoHasta: null,
          motivoEstado: ''
        });
      } else {
        await Usuario.findByIdAndUpdate(id, {
          estadoCuenta: 'activo',
          suspendidoHasta: null,
          motivoEstado: ''
        });
      }
      return res.json({ msg: 'Cuenta reactivada con éxito ✅' });
    }
    if (!motivo) {
      return res.status(400).json({ msg: 'Debes ingresar un motivo 🛑' });
    }

    if (tipo === 'marca') {
      const marca = await Marca.findById(id);
      if (!marca) return res.status(404).json({ msg: 'Marca no encontrada' });

      const actualizaciones = {
        estadoCuenta: estado,
        motivoEstado: motivo,
        estadoAprobacion: estado === 'activo' ? 'Aceptada' :
          estado === 'bloqueado' ? 'Bloqueada' :
            estado === 'suspendido' ? 'Suspendida' :
              'Rechazada'
      };

      if (estado === 'suspendido') {
        if (!dias || dias < 1 || dias > 30) {
          return res.status(400).json({ msg: 'Los días deben ser entre 1 y 30 🛑' });
        }
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + parseInt(dias));
        actualizaciones.suspendidoHasta = fecha;
      }

      if (estado === 'baneado') {
        actualizaciones.correoBaneado = true;
        await Marca.findByIdAndDelete(id);
        await enviarCorreoSancion(marca.correo, 'baneado', motivo);
        return res.json({ msg: 'Marca baneada y eliminada ✅' });
      }

      await Marca.findByIdAndUpdate(id, actualizaciones);
      await enviarCorreoSancion(marca.correo, estado, motivo, dias);

    } else {
      const usuario = await Usuario.findById(id);
      if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });

      const actualizaciones = { estadoCuenta: estado, motivoEstado: motivo };

      if (estado === 'suspendido') {
        if (!dias || dias < 1 || dias > 30) {
          return res.status(400).json({ msg: 'Los días deben ser entre 1 y 30 🛑' });
        }
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + parseInt(dias));
        actualizaciones.suspendidoHasta = fecha;
      }

      if (estado === 'baneado') {
        actualizaciones.correoBaneado = true;
        await Usuario.findByIdAndDelete(id);
        await enviarCorreoSancion(usuario.email, 'baneado', motivo);
        return res.json({ msg: 'Usuario baneado y eliminada ✅' });
      }

      await Usuario.findByIdAndUpdate(id, actualizaciones);
      await enviarCorreoSancion(usuario.email, estado, motivo, dias);
    }

    res.json({ msg: `Cuenta ${estado} con éxito ✅` });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ msg: 'Error al cambiar estado bro' });
  }
};

// --- ACEPTAR MARCA ---
exports.aceptarMarca = async (req, res) => {
  try {
    const { id } = req.params;
    const marca = await Marca.findById(id);
    if (!marca) return res.status(404).json({ msg: 'Marca no encontrada' });

    await Marca.findByIdAndUpdate(id, { estadoAprobacion: 'Aceptada' });
    await enviarCorreoAceptacionMarca(marca.correo, marca.nombreMarca);

    res.json({ msg: '¡Marca aceptada y notificada! 🎉' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ msg: 'Error al aceptar marca bro' });
  }
};