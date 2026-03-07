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
    },

    /**
     * Notifica al administrador sobre un nuevo reporte de pago
     * @param {string} nombreConductor - Nombre del conductor
     * @param {number} monto - Monto de la comisión
     */
    async enviarNotificacionReportePago(nombreConductor, monto) {
        try {
            // Enviar al email del admin configurado
            const emailAdmin = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'admin@moviflex.com';

            const email = {
                sender: {
                    name: "MoviFlex Pagos",
                    email: process.env.EMAIL_USER || "no-reply@moviflex.com"
                },
                to: [{
                    email: emailAdmin
                }],
                subject: `Nuevo Reporte de Pago - ${nombreConductor}`,
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <h2 style="color: #4acfbd; text-align: center;">Nuevo Reporte de Pago</h2>
                        <p>Se ha recibido un nuevo comprobante de pago en la plataforma <strong>MoviFlex</strong>.</p>
                        <div style="background-color: #f8fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Conductor:</strong> ${nombreConductor}</p>
                            <p><strong>Monto Comisión:</strong> $${Number(monto).toLocaleString()} COP</p>
                            <p><strong>Estado:</strong> <span style="color: #f39c12; font-weight: bold;">Pendiente de revisión</span></p>
                        </div>
                        <p>Ingresa al panel de administración para revisar y aprobar o rechazar este reporte.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://moviflex.com/admin/reportes-pago" style="background-color: #4acfbd; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver Reportes de Pago</a>
                        </div>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #8899a6; text-align: center;">MoviFlex Team</p>
                    </div>
                `
            };

            const result = await apiInstance.sendTransacEmail(email);
            console.log(`[EmailService] Notificación de reporte de pago enviada. ID: ${result.messageId}`);
            return true;
        } catch (error) {
            console.error(`[EmailService] Error enviando notificación de reporte de pago:`, error.message);
            return false;
        }
    },

    /**
     * Envía recordatorio de pago al conductor 5 días antes de fin de mes
     * @param {string} emailDestino - Correo del conductor
     * @param {string} nombre - Nombre del conductor
     * @param {number} montoComision - Monto pendiente
     * @param {number} diasRestantes - Días restantes para el fin de mes
     */
    async enviarRecordatorioPago(emailDestino, nombre, montoComision, diasRestantes) {
        try {
            const email = {
                sender: {
                    name: "MoviFlex Pagos",
                    email: process.env.EMAIL_USER || "no-reply@moviflex.com"
                },
                to: [{
                    email: emailDestino
                }],
                subject: `⚠️ Recordatorio de pago - Te quedan ${diasRestantes} días`,
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <h2 style="color: #f39c12; text-align: center;">⚠️ Recordatorio de Pago</h2>
                        <p>Hola <strong>${nombre}</strong>,</p>
                        <p>Te recordamos que tienes una comisión pendiente por pagar en <strong>MoviFlex</strong>.</p>
                        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f39c12;">
                            <p style="margin: 5px 0;"><strong>Comisión pendiente:</strong> $${Number(montoComision).toLocaleString()} COP</p>
                            <p style="margin: 5px 0;"><strong>Días restantes:</strong> <span style="color: #e74c3c; font-weight: bold;">${diasRestantes} días</span></p>
                        </div>
                        <p>⚠️ <strong>Importante:</strong> Si no envías el comprobante de pago antes de que termine el mes, tu cuenta será <strong>suspendida automáticamente</strong> y no podrás seguir ofreciendo viajes.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://moviflex.com/driver-home" style="background-color: #4acfbd; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Enviar Comprobante Ahora</a>
                        </div>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #8899a6; text-align: center;">MoviFlex Team</p>
                    </div>
                `
            };

            const result = await apiInstance.sendTransacEmail(email);
            console.log(`[EmailService] Recordatorio de pago enviado a ${emailDestino}. ID: ${result.messageId}`);
            return true;
        } catch (error) {
            console.error(`[EmailService] Error enviando recordatorio de pago:`, error.message);
            return false;
        }
    }
};

module.exports = EmailService;
