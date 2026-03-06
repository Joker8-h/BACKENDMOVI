const SibApiV3Sdk = require('sib-api-v3-sdk');

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const EmailService = {
    /**
     * Envía un código OTP al correo del usuario
     * @param {string} email - Correo del destinatario
     * @param {string} otp - Código de 6 dígitos
     * @param {string} nombre - Nombre del usuario
     */
    async enviarOtp(emailDestino, otp, nombre) {
        try {
            const email = {
                sender: {
                    name: "MoviFlex OTP Verification",
                    email: process.env.EMAIL_USER || "no-reply@moviflex.com"
                },
                to: [{
                    email: emailDestino
                }],
                subject: "Verifica tu cuenta en MoviFlex",
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <h2 style="color: #4acfbd; text-align: center;">Bienvenido a MoviFlex</h2>
                        <p>Hola <strong>${nombre}</strong>,</p>
                        <p>Gracias por registrarte en MoviFlex. Para completar tu registro y verificar tu correo electrónico, utiliza el siguiente código de verificación:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; background-color: #f8fafb; padding: 10px 20px; border-radius: 5px; border: 1px dashed #4acfbd;">
                                ${otp}
                            </span>
                        </div>
                        <p>Este código expirará en 10 minutos. Si no solicitaste este registro, puedes ignorar este mensaje.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #8899a6; text-align: center;">Este es un correo automático, por favor no respondas a este mensaje.</p>
                    </div>
                `
            };

            const result = await apiInstance.sendTransacEmail(email);
            console.log(`[EmailService] OTP enviado a ${emailDestino}. ID: ${result.messageId}`);
            return true;
        } catch (error) {
            console.error(`[EmailService] Error enviando OTP:`, error.message);
            throw new Error("No se pudo enviar el código de verificación por correo.");
        }
    },

    /**
     * Notifica al usuario que su cuenta ha sido activada
     * @param {string} emailDestino - Correo del destinatario
     * @param {string} nombre - Nombre del usuario
     */
    async enviarNotificacionActivacion(emailDestino, nombre) {
        try {
            const email = {
                sender: {
                    name: "MoviFlex",
                    email: process.env.EMAIL_USER || "no-reply@moviflex.com"
                },
                to: [{
                    email: emailDestino
                }],
                subject: "¡Tu cuenta en MoviFlex ha sido activada!",
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <h2 style="color: #4acfbd; text-align: center;">¡Buenas noticias, ${nombre}!</h2>
                        <p>Nos complace informarte que tu cuenta en <strong>MoviFlex</strong> ha sido activada satisfactoriamente por nuestro equipo administrativo.</p>
                        <p>A partir de este momento, ya puedes iniciar sesión en la plataforma y comenzar a disfrutar de todos los servicios que tenemos para ti.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://moviflex.com/login" style="background-color: #4acfbd; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Iniciar Sesión ahora</a>
                        </div>
                        <p>¡Gracias por confiar en nosotros!</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #8899a6; text-align: center;">MoviFlex Team</p>
                    </div>
                `
            };

            const result = await apiInstance.sendTransacEmail(email);
            console.log(`[EmailService] Notificación de activación enviada a ${emailDestino}. ID: ${result.messageId}`);
            return true;
        } catch (error) {
            console.error(`[EmailService] Error enviando notificación de activación:`, error.message);
            // No lanzamos error aquí para no bloquear el proceso de activación en la DB
            return false;
        }
    }
};

module.exports = EmailService;
