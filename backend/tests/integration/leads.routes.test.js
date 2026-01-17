/**
 * Testes de integração para as rotas de Leads
 */

import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';

// Mock do database
const mockExecute = jest.fn();
jest.unstable_mockModule('../../src/config/database.js', () => ({
    getDatabase: jest.fn(() => ({
        execute: mockExecute
    })),
    initDatabase: jest.fn(() => Promise.resolve())
}));

// Mock do logger
jest.unstable_mockModule('../../src/config/logger.js', () => ({
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    }
}));

// Mock do Redis
jest.unstable_mockModule('redis', () => ({
    createClient: jest.fn(() => ({
        connect: jest.fn(),
        on: jest.fn(),
        get: jest.fn(() => null),
        set: jest.fn(),
        del: jest.fn(),
        isOpen: true
    }))
}));

describe('Leads Routes Integration', () => {
    let app;
    let testToken;

    beforeAll(async () => {
        // Configurar variáveis de ambiente
        process.env.NODE_ENV = 'test';
        process.env.JWT_SECRET = 'test-secret-key-12345';
        process.env.JWT_EXPIRES_IN = '1h';

        // Gerar token de teste
        const jwt = await import('jsonwebtoken');
        testToken = jwt.default.sign(
            { userId: 1, username: 'testuser', level: 5 },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Importar app
        const appModule = await import('../../src/index.js');
        app = appModule.default || appModule.app;
    });

    beforeEach(() => {
        mockExecute.mockClear();
    });

    describe('GET /api/leads', () => {
        it('should return 401 without auth token', async () => {
            mockExecute.mockResolvedValueOnce([[], null]);

            const response = await request(app)
                .get('/api/leads');

            expect(response.status).toBe(401);
        });

        it('should return leads list with valid token', async () => {
            // Mock para contagem total
            mockExecute.mockResolvedValueOnce([[{ total: 2 }], null]);
            // Mock para lista de leads
            mockExecute.mockResolvedValueOnce([[
                { id: 1, cUser: 1, customerId: 100, totalGeral: 1000 },
                { id: 2, cUser: 1, customerId: 200, totalGeral: 2000 }
            ], null]);

            const response = await request(app)
                .get('/api/leads')
                .set('Authorization', `Bearer ${testToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should support pagination', async () => {
            mockExecute.mockResolvedValueOnce([[{ total: 100 }], null]);
            mockExecute.mockResolvedValueOnce([[], null]);

            const response = await request(app)
                .get('/api/leads?page=2&limit=10')
                .set('Authorization', `Bearer ${testToken}`);

            expect(response.status).toBe(200);
            expect(response.body.pagination).toBeDefined();
        });

        it('should support filtering by type', async () => {
            mockExecute.mockResolvedValueOnce([[{ total: 5 }], null]);
            mockExecute.mockResolvedValueOnce([[], null]);

            const response = await request(app)
                .get('/api/leads?type=1')
                .set('Authorization', `Bearer ${testToken}`);

            expect(response.status).toBe(200);
        });
    });

    describe('GET /api/leads/:id', () => {
        it('should return 400 for invalid id', async () => {
            const response = await request(app)
                .get('/api/leads/invalid')
                .set('Authorization', `Bearer ${testToken}`);

            expect(response.status).toBe(400);
        });

        it('should return 404 for non-existent lead', async () => {
            mockExecute.mockResolvedValueOnce([[], null]);

            const response = await request(app)
                .get('/api/leads/99999')
                .set('Authorization', `Bearer ${testToken}`);

            expect(response.status).toBe(404);
        });

        it('should return lead details for valid id', async () => {
            mockExecute.mockResolvedValueOnce([[{
                id: 1,
                cUser: 1,
                customerId: 100,
                totalGeral: 5000,
                freight: 100,
                type: 1
            }], null]);

            const response = await request(app)
                .get('/api/leads/1')
                .set('Authorization', `Bearer ${testToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(1);
        });
    });

    describe('POST /api/leads', () => {
        it('should create a new lead', async () => {
            // Mock para verificar cliente
            mockExecute.mockResolvedValueOnce([[{ codigo: 100 }], null]);
            // Mock para inserção
            mockExecute.mockResolvedValueOnce([{ insertId: 10 }, null]);
            // Mock para buscar o lead criado
            mockExecute.mockResolvedValueOnce([[{
                id: 10,
                cUser: 1,
                customerId: 100,
                type: 1
            }], null]);

            const response = await request(app)
                .post('/api/leads')
                .set('Authorization', `Bearer ${testToken}`)
                .send({
                    customerId: 100,
                    paymentType: 1,
                    freight: 100
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/leads')
                .set('Authorization', `Bearer ${testToken}`)
                .send({});

            expect(response.status).toBe(400);
        });
    });

    describe('PUT /api/leads/:id', () => {
        it('should update existing lead', async () => {
            // Mock para buscar lead existente
            mockExecute.mockResolvedValueOnce([[{
                id: 1,
                cUser: 1,
                customerId: 100,
                totalGeral: 1000
            }], null]);
            // Mock para atualização
            mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }, null]);
            // Mock para log de auditoria
            mockExecute.mockResolvedValueOnce([{}, null]);
            // Mock para retornar lead atualizado
            mockExecute.mockResolvedValueOnce([[{
                id: 1,
                cUser: 1,
                freight: 200
            }], null]);

            const response = await request(app)
                .put('/api/leads/1')
                .set('Authorization', `Bearer ${testToken}`)
                .send({
                    freight: 200
                });

            expect(response.status).toBe(200);
        });
    });

    describe('DELETE /api/leads/:id', () => {
        it('should delete lead', async () => {
            // Mock para buscar lead
            mockExecute.mockResolvedValueOnce([[{ id: 1, cUser: 1, orderWeb: null }], null]);
            // Mock para deletar itens
            mockExecute.mockResolvedValueOnce([{}, null]);
            // Mock para deletar lead
            mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }, null]);

            const response = await request(app)
                .delete('/api/leads/1')
                .set('Authorization', `Bearer ${testToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should not delete lead with orderWeb', async () => {
            mockExecute.mockResolvedValueOnce([[{ id: 1, cUser: 1, orderWeb: 5000 }], null]);

            const response = await request(app)
                .delete('/api/leads/1')
                .set('Authorization', `Bearer ${testToken}`);

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/leads/:id/history', () => {
        it('should return lead history', async () => {
            // Mock para buscar lead
            mockExecute.mockResolvedValueOnce([[{ id: 1, cUser: 1 }], null]);
            // Mock para buscar logs
            mockExecute.mockResolvedValueOnce([[
                { id: 1, action: 'LEAD_CREATE', user_name: 'test', created_at: new Date() },
                { id: 2, action: 'LEAD_UPDATE', user_name: 'test', created_at: new Date() }
            ], null]);

            const response = await request(app)
                .get('/api/leads/1/history')
                .set('Authorization', `Bearer ${testToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('POST /api/leads/:id/send-email', () => {
        it('should validate email format', async () => {
            mockExecute.mockResolvedValueOnce([[{ id: 1, cUser: 1 }], null]);

            const response = await request(app)
                .post('/api/leads/1/send-email')
                .set('Authorization', `Bearer ${testToken}`)
                .send({
                    email: 'invalid-email'
                });

            expect(response.status).toBe(400);
        });

        it('should require email field', async () => {
            mockExecute.mockResolvedValueOnce([[{ id: 1, cUser: 1 }], null]);

            const response = await request(app)
                .post('/api/leads/1/send-email')
                .set('Authorization', `Bearer ${testToken}`)
                .send({});

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/leads/export', () => {
        it('should export leads to Excel', async () => {
            // Mock para contagem
            mockExecute.mockResolvedValueOnce([[{ total: 1 }], null]);
            // Mock para leads
            mockExecute.mockResolvedValueOnce([[{
                id: 1,
                createdAt: new Date(),
                customerId: 100,
                totalGeral: 1000
            }], null]);

            const response = await request(app)
                .get('/api/leads/export')
                .set('Authorization', `Bearer ${testToken}`);

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('spreadsheet');
        });
    });
});
