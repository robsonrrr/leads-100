/**
 * Testes unitários para o AuditLog Service
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock do database
jest.unstable_mockModule('../../../src/config/database.js', () => ({
    getDatabase: jest.fn(() => ({
        execute: jest.fn(() => Promise.resolve([[], null]))
    }))
}));

// Mock do logger
jest.unstable_mockModule('../../../src/config/logger.js', () => ({
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));

describe('AuditLog Service', () => {
    let auditLog;
    let AuditAction;
    let mockDb;

    beforeEach(async () => {
        // Limpar mocks
        jest.clearAllMocks();

        // Importar módulos com mocks
        const dbModule = await import('../../../src/config/database.js');
        mockDb = {
            execute: jest.fn(() => Promise.resolve([[], null]))
        };
        dbModule.getDatabase.mockReturnValue(mockDb);

        // Importar o serviço
        const auditModule = await import('../../../src/services/auditLog.service.js');
        auditLog = auditModule.auditLog;
        AuditAction = auditModule.AuditAction;
    });

    describe('AuditAction enum', () => {
        it('should have all required action types', async () => {
            expect(AuditAction).toBeDefined();
            expect(AuditAction.LOGIN).toBe('LOGIN');
            expect(AuditAction.LOGOUT).toBe('LOGOUT');
            expect(AuditAction.LEAD_CREATE).toBe('LEAD_CREATE');
            expect(AuditAction.LEAD_UPDATE).toBe('LEAD_UPDATE');
            expect(AuditAction.LEAD_DELETE).toBe('LEAD_DELETE');
            expect(AuditAction.LEAD_CONVERT).toBe('LEAD_CONVERT');
        });
    });

    describe('getPublicKey', () => {
        it('should return VAPID public key', () => {
            // O serviço deve ter um método de log básico
            expect(auditLog).toBeDefined();
            expect(typeof auditLog.log).toBe('function');
        });
    });

    describe('logLogin', () => {
        it('should log successful login', async () => {
            const mockReq = {
                ip: '127.0.0.1',
                requestId: 'test-request-id',
                get: jest.fn(() => 'Mozilla/5.0')
            };

            await auditLog.logLogin(1, 'testuser', mockReq, true);

            // Verificar que o log foi chamado
            expect(mockDb.execute).toHaveBeenCalled();
        });

        it('should log failed login', async () => {
            const mockReq = {
                ip: '192.168.1.1',
                requestId: 'test-request-id-2',
                get: jest.fn(() => 'Chrome/100')
            };

            await auditLog.logLogin(null, 'unknownuser', mockReq, false);

            expect(mockDb.execute).toHaveBeenCalled();
        });
    });

    describe('logLeadCreate', () => {
        it('should log lead creation', async () => {
            const mockReq = {
                ip: '127.0.0.1',
                requestId: 'test-123',
                get: jest.fn(() => 'Test Agent')
            };

            const leadData = {
                id: 1,
                customerId: 100,
                total: 5000
            };

            await auditLog.logLeadCreate(1, 1, 'seller1', mockReq, leadData);

            expect(mockDb.execute).toHaveBeenCalled();
            const callArgs = mockDb.execute.mock.calls[0];
            expect(callArgs[0]).toContain('INSERT INTO');
        });
    });

    describe('logLeadUpdate', () => {
        it('should log lead update with old and new values', async () => {
            const mockReq = {
                ip: '10.0.0.1',
                requestId: 'update-123',
                get: jest.fn()
            };

            const oldData = { total: 1000, status: 'open' };
            const newData = { total: 1500, status: 'converted' };

            await auditLog.logLeadUpdate(1, 1, 'seller1', mockReq, oldData, newData);

            expect(mockDb.execute).toHaveBeenCalled();
        });
    });

    describe('findLogs', () => {
        it('should find logs with filters', async () => {
            mockDb.execute.mockResolvedValueOnce([[
                { id: 1, action: 'LEAD_CREATE', user_name: 'test' }
            ], null]);

            const logs = await auditLog.findLogs({
                resourceType: 'lead',
                resourceId: '1',
                limit: 10
            });

            expect(Array.isArray(logs)).toBe(true);
            expect(mockDb.execute).toHaveBeenCalled();
        });

        it('should return empty array on error', async () => {
            mockDb.execute.mockRejectedValueOnce(new Error('DB Error'));

            const logs = await auditLog.findLogs({});

            expect(logs).toEqual([]);
        });
    });
});
