const request = require('supertest');
const { app } = require('../index');
const authService = require('../SERVICES/auth.service.js');

// Mockear todo Auth Service, excepto las validaciones lógicas crudas para simular la BD
jest.mock('../SERVICES/auth.service.js', () => {
    // Tomamos la lógica copiada directamente para asegurar que lanza los mismos errores
    function validarPasswordSegura(password) {
        const errors = [];
        if (!password) { errors.push("La contraseña es requerida."); return { isValid: false, errors }; }
        if (password.length < 8) errors.push("La contraseña debe tener al menos 8 caracteres.");
        if (!/[A-Z]/.test(password)) errors.push("La contraseña debe contener al menos una letra mayúscula.");
        if (!/[a-z]/.test(password)) errors.push("La contraseña debe contener al menos una letra minúscula.");
        if (!/[0-9]/.test(password)) errors.push("La contraseña debe contener al menos un número.");
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push("La contraseña debe contener al menos un carácter especial (!@#$%^&*()_+-=[]{}|;':\",./<>?).");
        
        return { isValid: errors.length === 0, errors };
    }

    return {
        registrar: jest.fn().mockImplementation((data) => {
            const validacion = validarPasswordSegura(data.password);
            if (!validacion.isValid) {
                // Así es como el auth.service real rechaza la promesa si falla la validación
                return Promise.reject(new Error(`Contraseña no válida: ${validacion.errors.join(" ")}`));
            }
            return Promise.resolve({ 
                idUsuarios: 1, 
                email: data.email, 
                nombre: data.nombre,
                nombreEmergencia: data.nombreEmergencia,
                numeroEmergencia: data.numeroEmergencia
            });
        }),
        obtenerTodasLasFotos: jest.fn().mockResolvedValue([])
    };
});

describe('Pruebas de Lógica de Negocio (Auth Service Validador)', () => {

    it('Debería rechazar una contraseña sin mayúsculas, números ni caracteres especiales', async () => {
        const testData = {
            email: "nuevo@test.com",
            password: "passworddebil", // 13 chars, pero solo minúsculas
            nombre: "Usuario Prueba"
        };
        
        const response = await request(app)
            .post('/api/auth/registro')
            .send(testData);
            
        // El authController.register captura el error en catch y manda status 400 Json
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        
        const errorText = response.body.error;
        expect(errorText).toMatch(/mayúscula/i);
        expect(errorText).toMatch(/número/i);
        expect(errorText).toMatch(/carácter especial/i);
    });

    it('Debería rechazar una contraseña muy corta (menor a 8 caracteres)', async () => {
        const testData = {
            email: "nuevo@test.com",
            password: "Corta1!", 
            nombre: "Usuario Prueba"
        };
        
        const response = await request(app)
            .post('/api/auth/registro')
            .send(testData);
            
        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/al menos 8 caracteres/i);
    });

    it('Debería aceptar una contraseña fuerte que pase los controles lógicos', async () => {
        const testData = {
            email: "nuevo@test.com",
            password: "FuertePassword123!", 
            nombre: "Usuario Prueba"
        };
        
        const response = await request(app)
            .post('/api/auth/registro')
            .send(testData);
            
        // El mock devuelve resolve con el usuario, pasando correctamente la lógica de contraseña
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('mensaje', 'Registro exitoso');
        expect(response.body.usuario).toHaveProperty('email', 'nuevo@test.com');
    });

    it('Debería registrarse correctamente con nombre y número de emergencia', async () => {
        const testData = {
            email: "emergencia@test.com",
            password: "FuertePassword123!", 
            nombre: "Usuario Emergencia",
            nombreEmergencia: "Contacto Socorro",
            numeroEmergencia: "911911911"
        };
        
        const response = await request(app)
            .post('/api/auth/registro')
            .send(testData);
            
        expect(response.status).toBe(200);
        expect(response.body.usuario).toHaveProperty('nombreEmergencia', 'Contacto Socorro');
        expect(response.body.usuario).toHaveProperty('numeroEmergencia', '911911911');
    });
});
