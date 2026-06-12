// Archivo: backend/utils/emailService.js
// Este archivo es el encargado de enviar correos electrónicos a los usuarios y marcas.
// Usamos la librería "nodemailer" para conectarnos a un servicio de correo (en este caso Gmail) y 
// enviar los correos.
// Aquí definimos dos funciones: una para enviar un correo de bienvenida cuando una marca se registra,
//  y otra para enviar un código OTP (One-Time Password) cuando el usuario lo solicite.

const nodemailer = require('nodemailer');

const enviarCorreoBienvenida = async (correoDestino, nombreMarca) => {
    try {
        // 1. Configuramos el "Cartero" con las credenciales de Gmail
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // 2. Armamos el diseño del correo (Puedes meterle HTML y CSS básico)
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: correoDestino,
            subject: '👕 Solicitud Recibida - Hub Moda Urbana',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #000;">¡Hola ${nombreMarca}! 🚀</h2>
                    <p>Hemos recibido tu solicitud oficial para unirte al <b>Hub de Moda Urbana</b>.</p>
                    <p>Actualmente tu cuenta está en estado <span style="background-color: #ffd700; padding: 3px 8px; border-radius: 5px; font-weight: bold;">Pendiente</span>.</p>
                    <p>Nuestro equipo administrador está revisando tu RUC y tus datos. Te enviaremos un nuevo correo en cuanto tu marca sea <b>Aceptada</b> para que puedas iniciar sesión y empezar a subir tu ropa.</p>
                    <br>
                    <p>¡Gracias por querer formar parte de la comunidad!</p>
                    <p>Saludos,<br><b>El equipo del Hub 🗿</b></p>
                </div>
            `
        };

        // 3. ¡Enviamos el correo!
        await transporter.sendMail(mailOptions);
        console.log(`Correo enviado con éxito a: ${correoDestino}`);

    } catch (error) {
        console.error("Error enviando el correo de bienvenida:", error);
    }
};

const enviarCorreoOTP = async (correoDestino, codigoOtp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: correoDestino,
            subject: '🔐 Código de Verificación - Hub Moda Urbana',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; text-align: center;">
                    <h2>Verifica tu correo</h2>
                    <p>Usa el siguiente código para completar tu registro en el Hub. Este código expira en 5 minutos.</p>
                    <div style="margin: 20px auto; padding: 15px; font-size: 24px; font-weight: bold; background-color: #f4f4f4; border-radius: 10px; width: fit-content; letter-spacing: 5px;">
                        ${codigoOtp}
                    </div>
                    <p>Si no fuiste tú, ignora este mensaje.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`OTP enviado a: ${correoDestino}`);

    } catch (error) {
        console.error("Error enviando el OTP:", error);
        throw new Error("No se pudo enviar el correo");
    }
};

// --- NUEVAS FUNCIONES PARA CORREOS DE PEDIDOS ---

const enviarCorreoAprobacion = async (correoDestino, numeroRastreo, fotoUrl) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: correoDestino,
      subject: '✅ Tu pedido fue aprobado - Hub Moda Urbana',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #f59e0b;">¡Tu pedido fue aprobado! 🎉</h2>
          <p>Hemos verificado tu pago y tu pedido está en camino.</p>
          <p><b>Número de rastreo:</b> <span style="font-size:18px; font-weight:bold;">${numeroRastreo}</span></p>
          ${fotoUrl ? `<p><b>Comprobante de envío:</b></p><img src="${fotoUrl}" style="max-width:300px; border-radius:8px;" />` : ''}
          <br>
          <p>¡Gracias por comprar en Hub Moda Urbana! 🛍️</p>
        </div>
      `
    });
    console.log(`Correo aprobación enviado a: ${correoDestino}`);
  } catch (error) {
    console.error('Error enviando correo aprobación:', error);
  }
};

const enviarCorreoRechazo = async (correoDestino, motivoRechazo) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: correoDestino,
      subject: '❌ Tu pedido fue rechazado - Hub Moda Urbana',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #ef4444;">Tu pedido fue rechazado 😔</h2>
          <p><b>Motivo:</b> ${motivoRechazo}</p>
          <p>Si crees que es un error, contáctanos o vuelve a intentarlo.</p>
          <br>
          <p>Saludos,<br><b>El equipo del Hub 🗿</b></p>
        </div>
      `
    });
    console.log(`Correo rechazo enviado a: ${correoDestino}`);
  } catch (error) {
    console.error('Error enviando correo rechazo:', error);
  }
};

const enviarCorreoEntregado = async (correoDestino) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: correoDestino,
      subject: '📦 Pedido entregado - Hub Moda Urbana',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; text-align:center;">
          <h2 style="color: #22c55e;">¡Tu pedido fue entregado! 🎊</h2>
          <p>Esperamos que ames tu nueva prenda.</p>
          <p>Gracias por ser parte de <b>Hub Moda Urbana</b>. ¡Vuelve pronto! 🛍️</p>
          <br>
          <p style="color:#888;">Si tienes algún problema con tu pedido, contáctanos.</p>
        </div>
      `
    });
    console.log(`Correo entregado enviado a: ${correoDestino}`);
  } catch (error) {
    console.error('Error enviando correo entregado:', error);
  }
};

// --- NUEVA FUNCIÓN PARA CORREOS DE SANCIONES (Bloqueo, Suspensión, Baneo) ---
const enviarCorreoSancion = async (correoDestino, tipo, motivo, dias = null) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const configs = {
      bloqueado: {
        asunto: '🔒 Tu cuenta ha sido bloqueada - Hub Moda Urbana',
        color: '#f97316',
        titulo: 'Cuenta Bloqueada',
        descripcion: 'Tu cuenta ha sido bloqueada. Puedes seguir navegando en la app pero no podrás realizar compras ni gestionar productos hasta que se resuelva esta situación.',
      },
      suspendido: {
        asunto: '⏸️ Tu cuenta ha sido suspendida - Hub Moda Urbana',
        color: '#9333ea',
        titulo: `Cuenta Suspendida por ${dias} día(s)`,
        descripcion: `Tu cuenta ha sido suspendida temporalmente por ${dias} día(s). Durante este tiempo no podrás acceder a la aplicación.`,
      },
      baneado: {
        asunto: '🚫 Tu cuenta ha sido eliminada - Hub Moda Urbana',
        color: '#ef4444',
        titulo: 'Cuenta Eliminada Permanentemente',
        descripcion: 'Tu cuenta ha sido eliminada permanentemente de Hub Moda Urbana. Esta decisión es definitiva.',
      },
    };

    const config = configs[tipo] || configs.bloqueado;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: correoDestino,
      subject: config.asunto,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: ${config.color};">${config.titulo}</h2>
          <p>${config.descripcion}</p>
          <p><b>Motivo:</b> ${motivo}</p>
          <br>
          <p style="color: #888; font-size: 12px;">Si crees que esto es un error, contacta a soporte.</p>
          <p>Saludos,<br><b>El equipo de Hub Moda Urbana 🗿</b></p>
        </div>
      `
    });
  } catch (error) {
    console.error('Error enviando correo sanción:', error);
  }
};

// --- NUEVA FUNCIÓN PARA CORREO DE ACEPTACIÓN DE MARCA ---
const enviarCorreoAceptacionMarca = async (correoDestino, nombreMarca) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: correoDestino,
      subject: '✅ ¡Tu marca fue aceptada! - Hub Moda Urbana',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #22c55e;">¡Felicitaciones ${nombreMarca}! 🎉</h2>
          <p>Tu solicitud para unirte al <b>Hub de Moda Urbana</b> ha sido <b>aprobada</b>.</p>
          <p>Ya puedes iniciar sesión y comenzar a subir tus productos.</p>
          <br>
          <p>¡Bienvenido a la familia!</p>
          <p>Saludos,<br><b>El equipo del Hub 🗿</b></p>
        </div>
      `
    });
  } catch (error) {
    console.error('Error enviando correo aceptación marca:', error);
  }
};

module.exports = { 
  enviarCorreoBienvenida, 
  enviarCorreoOTP,
  enviarCorreoAprobacion,
  enviarCorreoRechazo,
  enviarCorreoEntregado,
  enviarCorreoSancion,
  enviarCorreoAceptacionMarca,
};