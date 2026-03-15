const request = require('supertest');
const { app, server } = require('../index');

describe('Pruebas del Endpoint de Autenticación', () => {

    afterAll((done) => {
        done();
    });

    it('Debería retornar un error de credenciales si al login se le pasa un usuario no existente', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'usuario.inexistente.12345@gmail.com',
                password: 'Password123!'
            });
            
        expect(response.status).toBeGreaterThanOrEqual(400);
        
        expect(response.body).toBeDefined();
        
        const tieneMensaje = response.body.mensaje ? true : false;
        const tieneError = response.body.error ? true : false;
        expect(tieneMensaje || tieneError).toBeTruthy();
    });

    it('Debería rechazar peticiones de login sin cuerpo de datos', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({});
            
        expect(response.status).toBeGreaterThanOrEqual(400);
    });

});
