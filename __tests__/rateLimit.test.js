const request = require('supertest');
const { app } = require('../index');

describe('Pruebas de Rate Limiter (Protección Anti-Fuerza Bruta)', () => {
    // Aumentamos el timeout de esta suite porque vamos a hacer +100 peticiones en red (local)
    jest.setTimeout(15000);

    it('Debería bloquear las peticiones extras después de 100 intentos fallidos en /api/auth/login', async () => {
        const url_login = '/api/auth/login';
        const body_prueba = { email: "test@fuerzabruta.com", password: "123" };
        
        let respuestasStatus429Encontradas = 0;
        
        // El límite registrado en Authroutes.js para login es de 100 peticiones 
        // Vamos a enviar 105 peticiones asíncronas masivas concurrentes al endpoint de login.
        
        const peticiones = [];
        for (let i = 0; i < 105; i++) {
            peticiones.push(request(app).post(url_login).send(body_prueba));
        }

        const respuestas = await Promise.all(peticiones);

        respuestas.forEach(res => {
            if (res.status === 429) {
                respuestasStatus429Encontradas++;
                expect(res.text).toMatch(/Demasiados intentos de inicio de sesión/i);
            }
            // Las primeras 100 deberían ser 400 (Bad Request) o 401 si no la halla la BD, ya que los datos son falsos o incompletos.
        });

        // Aseguramos que exactamente las 5 peticiones extra fueron las bloqueadas con el status 429 (Too Many Requests)
        expect(respuestasStatus429Encontradas).toBe(5);
    });
});
