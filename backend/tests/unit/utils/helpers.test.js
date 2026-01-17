/**
 * Testes unitários para funções utilitárias
 */

import { describe, it, expect } from '@jest/globals';

describe('Utility Functions', () => {

    describe('formatCurrency', () => {
        const formatCurrency = (value) => {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(value || 0);
        };

        it('should format number as BRL currency', () => {
            expect(formatCurrency(1000)).toBe('R$ 1.000,00');
            expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
            expect(formatCurrency(0)).toBe('R$ 0,00');
        });

        it('should handle null/undefined values', () => {
            expect(formatCurrency(null)).toBe('R$ 0,00');
            expect(formatCurrency(undefined)).toBe('R$ 0,00');
        });

        it('should handle negative values', () => {
            expect(formatCurrency(-500)).toBe('-R$ 500,00');
        });
    });

    describe('formatDate', () => {
        const formatDate = (dateString) => {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR');
        };

        it('should format date as pt-BR format', () => {
            expect(formatDate('2026-01-17')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
        });

        it('should return dash for empty values', () => {
            expect(formatDate(null)).toBe('-');
            expect(formatDate(undefined)).toBe('-');
            expect(formatDate('')).toBe('-');
        });
    });

    describe('validateEmail', () => {
        const validateEmail = (email) => {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return regex.test(email);
        };

        it('should validate correct emails', () => {
            expect(validateEmail('user@domain.com')).toBe(true);
            expect(validateEmail('user.name@domain.com.br')).toBe(true);
            expect(validateEmail('user+tag@domain.io')).toBe(true);
        });

        it('should reject invalid emails', () => {
            expect(validateEmail('invalid')).toBe(false);
            expect(validateEmail('user@')).toBe(false);
            expect(validateEmail('@domain.com')).toBe(false);
            expect(validateEmail('user domain.com')).toBe(false);
        });
    });

    describe('sanitizeInput', () => {
        const sanitizeInput = (input) => {
            if (typeof input !== 'string') return input;
            return input
                .replace(/[<>]/g, '')
                .trim();
        };

        it('should remove HTML tags', () => {
            expect(sanitizeInput('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
        });

        it('should trim whitespace', () => {
            expect(sanitizeInput('  hello  ')).toBe('hello');
        });

        it('should handle non-string inputs', () => {
            expect(sanitizeInput(123)).toBe(123);
            expect(sanitizeInput(null)).toBe(null);
        });
    });

    describe('calculatePercentage', () => {
        const calculatePercentage = (value, total) => {
            if (!total || total === 0) return 0;
            return Math.round((value / total) * 100);
        };

        it('should calculate percentage correctly', () => {
            expect(calculatePercentage(50, 100)).toBe(50);
            expect(calculatePercentage(25, 100)).toBe(25);
            expect(calculatePercentage(1, 3)).toBe(33);
        });

        it('should handle zero total', () => {
            expect(calculatePercentage(50, 0)).toBe(0);
        });

        it('should handle null values', () => {
            expect(calculatePercentage(null, 100)).toBe(0);
            expect(calculatePercentage(50, null)).toBe(0);
        });
    });

    describe('parseQueryParams', () => {
        const parseQueryParams = (params) => {
            const result = {};

            if (params.page) result.page = parseInt(params.page) || 1;
            if (params.limit) result.limit = Math.min(parseInt(params.limit) || 20, 100);
            if (params.sort) result.sort = params.sort;
            if (params.order) result.order = ['asc', 'desc'].includes(params.order?.toLowerCase())
                ? params.order.toLowerCase()
                : 'desc';

            return result;
        };

        it('should parse pagination params', () => {
            const result = parseQueryParams({ page: '2', limit: '50' });
            expect(result.page).toBe(2);
            expect(result.limit).toBe(50);
        });

        it('should enforce max limit', () => {
            const result = parseQueryParams({ limit: '200' });
            expect(result.limit).toBe(100);
        });

        it('should validate sort order', () => {
            expect(parseQueryParams({ order: 'ASC' }).order).toBe('asc');
            expect(parseQueryParams({ order: 'invalid' }).order).toBe('desc');
        });
    });

    describe('groupBy', () => {
        const groupBy = (array, key) => {
            return array.reduce((result, item) => {
                const group = item[key];
                if (!result[group]) result[group] = [];
                result[group].push(item);
                return result;
            }, {});
        };

        it('should group array by key', () => {
            const items = [
                { type: 'A', value: 1 },
                { type: 'B', value: 2 },
                { type: 'A', value: 3 }
            ];

            const result = groupBy(items, 'type');

            expect(result.A).toHaveLength(2);
            expect(result.B).toHaveLength(1);
        });

        it('should handle empty array', () => {
            expect(groupBy([], 'type')).toEqual({});
        });
    });

    describe('debounce', () => {
        it('should delay function execution', async () => {
            jest.useFakeTimers();

            const mockFn = jest.fn();
            const debounce = (fn, delay) => {
                let timeoutId;
                return (...args) => {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => fn(...args), delay);
                };
            };

            const debouncedFn = debounce(mockFn, 100);

            debouncedFn();
            debouncedFn();
            debouncedFn();

            expect(mockFn).not.toHaveBeenCalled();

            jest.advanceTimersByTime(100);

            expect(mockFn).toHaveBeenCalledTimes(1);

            jest.useRealTimers();
        });
    });

    describe('truncateText', () => {
        const truncateText = (text, maxLength) => {
            if (!text || text.length <= maxLength) return text;
            return text.slice(0, maxLength - 3) + '...';
        };

        it('should truncate long text', () => {
            expect(truncateText('Hello World', 8)).toBe('Hello...');
        });

        it('should not truncate short text', () => {
            expect(truncateText('Hello', 10)).toBe('Hello');
        });

        it('should handle empty text', () => {
            expect(truncateText('', 10)).toBe('');
            expect(truncateText(null, 10)).toBe(null);
        });
    });

    describe('generateSlug', () => {
        const generateSlug = (text) => {
            return text
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
        };

        it('should generate URL-friendly slug', () => {
            expect(generateSlug('Hello World')).toBe('hello-world');
            expect(generateSlug('São Paulo')).toBe('sao-paulo');
            expect(generateSlug('Test  123')).toBe('test-123');
        });

        it('should remove special characters', () => {
            expect(generateSlug('Hello@World!')).toBe('hello-world');
        });
    });
});
