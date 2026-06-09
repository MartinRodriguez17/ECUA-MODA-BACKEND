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

module.exports = { enviarCorreoBienvenida, enviarCorreoOTP };