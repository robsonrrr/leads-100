/**
 * Testes unitários para o Email Service
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock do nodemailer
jest.unstable_mockModule('nodemailer', () => ({
    default: {
        createTransport: jest.fn(() => ({
            verify: jest.fn((cb) => cb(null, true)),
            sendMail: jest.fn(() => Promise.resolve({
                messageId: 'test-message-id@test.com',
                response: '250 OK'
            })),
            _isTest: false
        }))
    }
}));

// Mock do logger
jest.unstable_mockModule('../../../src/config/logger.js', () => ({
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));

describe('Email Service', () => {
    let emailService;
    let nodemailer;

    beforeEach(async () => {
        jest.clearAllMocks();

        // Configurar variáveis de ambiente para teste
        process.env.SMTP_HOST = 'smtp.test.com';
        process.env.SMTP_PORT = '587';
        process.env.SMTP_USER = 'test@test.com';
        process.env.SMTP_PASS = 'testpass';
        process.env.SMTP_FROM_NAME = 'Test App';
        process.env.SMTP_FROM_EMAIL = 'noreply@test.com';

        // Importar módulos
        nodemailer = await import('nodemailer');
        emailService = await import('../../../src/services/email.service.js');
    });

    describe('sendEmail', () => {
        it('should send email successfully', async () => {
            const result = await emailService.sendEmail({
                to: 'recipient@test.com',
                subject: 'Test Subject',
                text: 'Test body',
                html: '<p>Test body</p>'
            });

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.messageId).toBeDefined();
        });

        it('should handle array of recipients', async () => {
            const result = await emailService.sendEmail({
                to: ['user1@test.com', 'user2@test.com'],
                subject: 'Test Subject',
                text: 'Test body'
            });

            expect(result.success).toBe(true);
        });

        it('should handle CC and BCC', async () => {
            const result = await emailService.sendEmail({
                to: 'recipient@test.com',
                cc: 'cc@test.com',
                bcc: 'bcc@test.com',
                subject: 'Test Subject',
                text: 'Test body'
            });

            expect(result.success).toBe(true);
        });
    });

    describe('sendLeadQuotation', () => {
        it('should send quotation email with items', async () => {
            const lead = {
                id: 123,
                customerName: 'John Doe',
                customer: { nome: 'John Doe' },
                paymentTerms: '30 dias',
                totalGeral: 5000,
                items: [
                    { productModel: 'ABC123', productName: 'Product 1', quantity: 2, price: 100 },
                    { productModel: 'DEF456', productName: 'Product 2', quantity: 1, price: 200 }
                ]
            };

            const result = await emailService.sendLeadQuotation(
                lead,
                'customer@test.com',
                {
                    senderName: 'Sales Team',
                    customMessage: 'Hello!'
                }
            );

            expect(result.success).toBe(true);
            expect(result.messageId).toBeDefined();
        });

        it('should handle lead without items', async () => {
            const lead = {
                id: 456,
                customerName: 'Jane Doe',
                totalGeral: 0
            };

            const result = await emailService.sendLeadQuotation(
                lead,
                'customer@test.com'
            );

            expect(result.success).toBe(true);
        });

        it('should include CC emails when provided', async () => {
            const lead = {
                id: 789,
                customerName: 'Bob',
                totalGeral: 1000
            };

            const result = await emailService.sendLeadQuotation(
                lead,
                'customer@test.com',
                { ccEmails: ['manager@test.com', 'supervisor@test.com'] }
            );

            expect(result.success).toBe(true);
        });
    });

    describe('sendOrderConfirmation', () => {
        it('should send order confirmation email', async () => {
            const lead = {
                id: 100,
                customerName: 'Customer Corp'
            };

            const order = {
                id: 500,
                orderId: 500
            };

            const result = await emailService.sendOrderConfirmation(
                lead,
                order,
                'customer@test.com'
            );

            expect(result.success).toBe(true);
        });
    });
});

describe('Email Service - Test Mode', () => {
    beforeEach(async () => {
        jest.clearAllMocks();

        // Remover credenciais para ativar modo de teste
        delete process.env.SMTP_USER;
        delete process.env.SMTP_PASS;
    });

    it('should work in test mode without SMTP credentials', async () => {
        const emailService = await import('../../../src/services/email.service.js');

        // Em modo de teste, deve simular o envio
        const result = await emailService.sendEmail({
            to: 'test@test.com',
            subject: 'Test',
            text: 'Test'
        });

        // Deve retornar sucesso mesmo em modo teste
        expect(result).toBeDefined();
    });
});
