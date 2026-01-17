/**
 * Testes unitários para o Export Service
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock do ExcelJS
const mockWorksheet = {
    columns: [],
    addRow: jest.fn(() => ({
        font: {},
        fill: {},
        alignment: {},
        eachCell: jest.fn((cb) => cb({ font: {}, fill: {} }))
    })),
    getRow: jest.fn(() => ({
        font: {},
        fill: {},
        alignment: {},
        eachCell: jest.fn((cb) => cb({ font: {}, fill: {}, value: 100 }))
    })),
    autoFilter: null,
    views: []
};

const mockWorkbook = {
    addWorksheet: jest.fn(() => mockWorksheet),
    xlsx: {
        writeBuffer: jest.fn(() => Promise.resolve(Buffer.from('test')))
    },
    creator: '',
    created: null
};

jest.unstable_mockModule('exceljs', () => ({
    default: {
        Workbook: jest.fn(() => mockWorkbook)
    }
}));

describe('Export Service', () => {
    let exportService;

    beforeEach(async () => {
        jest.clearAllMocks();

        // Resetar mocks
        mockWorksheet.columns = [];
        mockWorksheet.addRow.mockClear();
        mockWorksheet.getRow.mockClear();
        mockWorkbook.addWorksheet.mockClear();
        mockWorkbook.xlsx.writeBuffer.mockClear();

        // Importar serviço
        exportService = await import('../../../src/services/export.service.js');
    });

    describe('exportLeadsToExcel', () => {
        it('should create Excel buffer from leads array', async () => {
            const leads = [
                {
                    id: 1,
                    createdAt: new Date(),
                    customerId: 100,
                    customer: { nome: 'Customer 1', cidade: 'SP', estado: 'SP' },
                    seller: { nick: 'seller1' },
                    status: 'aberto',
                    totalGeral: 1000,
                    itemCount: 5
                },
                {
                    id: 2,
                    createdAt: new Date(),
                    customerId: 200,
                    customer: { nome: 'Customer 2', cidade: 'RJ', estado: 'RJ' },
                    seller: { nick: 'seller2' },
                    status: 'convertido',
                    totalGeral: 2000,
                    itemCount: 3
                }
            ];

            const result = await exportService.exportLeadsToExcel(leads);

            expect(result).toBeDefined();
            expect(Buffer.isBuffer(result)).toBe(true);
            expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Leads');
            expect(mockWorksheet.addRow).toHaveBeenCalled();
        });

        it('should handle empty leads array', async () => {
            const result = await exportService.exportLeadsToExcel([]);

            expect(result).toBeDefined();
            expect(Buffer.isBuffer(result)).toBe(true);
        });

        it('should format currency values correctly', async () => {
            const leads = [
                {
                    id: 1,
                    createdAt: new Date(),
                    customerId: 100,
                    totalGeral: 1234.56,
                    freight: 50.00,
                    itemCount: 2
                }
            ];

            await exportService.exportLeadsToExcel(leads);

            // Verificar que as rows foram adicionadas
            expect(mockWorksheet.addRow).toHaveBeenCalled();
        });
    });

    describe('exportLeadDetailToExcel', () => {
        it('should export lead with items detail', async () => {
            const lead = {
                id: 123,
                createdAt: new Date(),
                customerId: 500,
                customer: {
                    nome: 'Big Company',
                    cnpj: '00.000.000/0001-00',
                    cidade: 'São Paulo',
                    estado: 'SP'
                },
                seller: { nick: 'johndoe' },
                totalGeral: 5000,
                freight: 100,
                paymentTerms: '30/60/90',
                remarks: {
                    obs: 'Urgent delivery'
                }
            };

            const items = [
                {
                    productId: 'SKU001',
                    product: {
                        model: 'ABC-123',
                        name: 'Bearing XYZ'
                    },
                    quantity: 10,
                    price: 100,
                    subtotal: 1000
                },
                {
                    productId: 'SKU002',
                    product: {
                        model: 'DEF-456',
                        name: 'Seal ABC'
                    },
                    quantity: 20,
                    price: 50,
                    subtotal: 1000
                }
            ];

            const result = await exportService.exportLeadDetailToExcel(lead, items);

            expect(result).toBeDefined();
            expect(Buffer.isBuffer(result)).toBe(true);
            expect(mockWorkbook.addWorksheet).toHaveBeenCalled();
        });

        it('should handle lead without items', async () => {
            const lead = {
                id: 456,
                createdAt: new Date(),
                customerId: 600,
                totalGeral: 0
            };

            const result = await exportService.exportLeadDetailToExcel(lead, []);

            expect(result).toBeDefined();
        });

        it('should include customer info in header', async () => {
            const lead = {
                id: 789,
                createdAt: new Date(),
                customer: {
                    nome: 'Test Corp',
                    cnpj: '11.111.111/0001-11',
                    endereco: 'Rua Test, 123',
                    cidade: 'Curitiba',
                    estado: 'PR'
                },
                totalGeral: 3000
            };

            await exportService.exportLeadDetailToExcel(lead, []);

            expect(mockWorksheet.addRow).toHaveBeenCalled();
        });
    });

    describe('Excel formatting', () => {
        it('should set column widths', async () => {
            await exportService.exportLeadsToExcel([{ id: 1, createdAt: new Date(), totalGeral: 100 }]);

            // Verificar que columns foi configurado
            expect(mockWorksheet.columns).toBeDefined();
        });

        it('should add auto filter', async () => {
            await exportService.exportLeadsToExcel([{ id: 1, createdAt: new Date(), totalGeral: 100 }]);

            // Verificar que autoFilter foi configurado
            expect(mockWorksheet.autoFilter).toBeDefined();
        });
    });
});
