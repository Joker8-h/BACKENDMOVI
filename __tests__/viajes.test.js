const request = require('supertest');
const { app } = require('../index');
const jwt = require('jsonwebtoken');

// 1. Mock de los servicios de viajes y documentación
jest.mock('../SERVICES/ViajesService', () => ({
    getMisViajesConductor: jest.fn().mockImplementation((idUsuario) => {
        if (idUsuario === 1) return Promise.resolve([{ idViajes: 100, lugarOrigen: 'UdeA' }]);
        return Promise.resolve([]);
    }),
    getById: jest.fn().mockImplementation((id) => {
        if (id === '999') return Promise.resolve(null);
        return Promise.resolve({ idViajes: id, estado: 'DISPONIBLE' });
    }),
    create: jest.fn().mockImplementation((data) => {
        if (!data.precio) throw new Error("Precio es obligatorio");
        return Promise.resolve({ idViajes: 200, ...data });
    })
}));

jest.mock('../SERVICES/DocumentacionService', () => ({
    getByUsuarioId: jest.fn().mockImplementation((id) => {
        if (id === 2) return Promise.resolve({ estado: 'RECHAZADO' }); // Caso para rechazar
        return Promise.resolve({ estado: 'APROBADO' });
    })
}));

// Generamos tokens válidos
const conductorToken = jwt.sign(
    { id: 1, email: 'conductor@test.com', nombre: 'Test', idRol: 2, rol: 'CONDUCTOR' },
    process.env.JWT_SECRET || 'secreto_super_seguro',
    { expiresIn: '1h' }
);

const conductorRechazadoToken = jwt.sign(
    { id: 2, email: 'malo@test.com', nombre: 'Malo', idRol: 2, rol: 'CONDUCTOR' },
    process.env.JWT_SECRET || 'secreto_super_seguro',
    { expiresIn: '1h' }
);

describe('Pruebas Estructurales de Validación - Viajes', () => {

    it('Debería retornar los viajes del conductor (GET /api/viajes/mis-viajes)', async () => {
        const response = await request(app)
            .get('/api/viajes/mis-viajes')
            .set('Authorization', `Bearer ${conductorToken}`);
            
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body[0]).toHaveProperty('lugarOrigen', 'UdeA');
    });

    it('No debería permitir publicar un viaje a un conductor con documentación rechazada (POST /api/viajes)', async () => {
        const response = await request(app)
            .post('/api/viajes')
            .set('Authorization', `Bearer ${conductorRechazadoToken}`)
            .send({ precio: 5000 });
            
        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toMatch(/documentación ha sido rechazada/i);
    });

    it('Debería poder consultar un viaje específico y mostrar si no existe (GET /api/viajes/:id)', async () => {
        // Viaje que sí existe (id: 1)
        const responseOk = await request(app).get('/api/viajes/1').set('Authorization', `Bearer ${conductorToken}`);
        expect(responseOk.status).toBe(200);
        expect(responseOk.body).toHaveProperty('estado', 'DISPONIBLE');

        // Viaje que no existe (id: 999)
        const responseFail = await request(app).get('/api/viajes/999').set('Authorization', `Bearer ${conductorToken}`);
        expect(responseFail.status).toBe(200); // El controlador original devuelve res.json() (status 200 implícito) 
        expect(responseFail.body).toHaveProperty('error', 'Viaje no encontrado');
    });
});
