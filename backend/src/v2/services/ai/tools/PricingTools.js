import { externalPricingService } from '../../../../services/pricing.service.js';
import { TaxRepository } from '../../../../repositories/tax.repository.js';
import { CustomerRepository } from '../../../../repositories/customer.repository.js';
import { ProductRepository } from '../../../../repositories/product.repository.js';
import logger from '../../../../config/logger.js';

const taxRepository = new TaxRepository();
const customerRepository = new CustomerRepository();
const productRepository = new ProductRepository();

export const pricingTools = {
    definitions: [
        {
            type: 'function',
            function: {
                name: 'simulate_pricing',
                description: 'Simulate pricing using the CSuite Pricing Agent. Calculates the best price based on customer volume, product curve, stock levels, and payment terms. Also calculates IPI/ST taxes.',
                parameters: {
                    type: 'object',
                    properties: {
                        customerId: { type: 'integer', description: 'The ID of the customer' },
                        items: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    productId: { type: 'integer', description: 'Product ID' },
                                    quantity: { type: 'integer', default: 1 }
                                },
                                required: ['productId']
                            }
                        },
                        installments: { type: 'integer', description: 'Number of installments (payment terms). Affects discount.', default: 1 }
                    },
                    required: ['customerId', 'items']
                }
            }
        }
    ],

    handlers: {
        async simulate_pricing(args) {
            const { customerId, items, installments = 1, userId, userLevel } = args;

            try {
                // 1. Obter dados básicos
                const customer = await customerRepository.findById(customerId);
                if (!customer) return JSON.stringify({ error: `Cliente ${customerId} não encontrado.` });

                // 2. Buscar todos os produtos em UMA ÚNICA QUERY (elimina N+1)
                const productIds = items.map(item => item.productId).filter(id => id != null);
                const productsMap = await productRepository.findByIds(productIds);

                // 3. Enriquecer itens com dados dos produtos
                const enrichedItems = items.map(item => {
                    const product = productsMap.get(item.productId);
                    return {
                        ...item,
                        product,
                        revenda: product ? parseFloat(product.revenda) : 0,
                        brand: product ? product.marca : 'ZOJE',
                        model: product ? product.modelo : '',
                        name: product ? product.nome : ''
                    };
                });

                // 4. Calcular Order Value (Soma dos preços de tabela * quantidade)
                const orderValue = enrichedItems.reduce((sum, item) => sum + (item.revenda * item.quantity), 0);

                // 5. Montar order_items para o payload (contexto do carrinho)
                const orderItems = enrichedItems.map(item => ({
                    sku_id: item.productId,
                    quantity: item.quantity,
                    model: item.model
                }));

                // 5. Chamar Pricing API para cada item (Sequencial para evitar sobrecarga e manter clareza)
                const simulationResults = [];
                let totalIPI = 0;
                let totalST = 0;
                let totalNet = 0;

                for (const item of enrichedItems) {
                    const brandId = await externalPricingService.getBrandId(item.brand) || 3755581063; // Default VOJE se não achar

                    const payload = {
                        org_id: 1,
                        brand_id: brandId,
                        customer_id: customerId,
                        sku_id: item.productId,
                        sku_qty: item.quantity,
                        order_value: orderValue,
                        product_brand: item.brand,
                        product_model: item.model || item.name,
                        installments: installments,
                        order_items: orderItems,
                        payment_term: 'standard',
                        stock_level: 'normal',
                        machine_curve: 'A'
                    };

                    const pricingResponse = await externalPricingService.calculate(payload);

                    // Extrair dados da resposta (Seguindo a estrutura do CSuite.Pricing.Agent)
                    const pricingResult = pricingResponse.result?.result || pricingResponse.result;
                    const decision = pricingResult?.decision;
                    const execution = pricingResult?.execution;
                    const finalPrice = execution?.actions?.[0]?.new_price || decision?.final_price || item.revenda;

                    // 6. Calcular Impostos para este item
                    const taxRules = await taxRepository.getTaxRules({
                        state: customer.estado || 'SP',
                        peopleType: customer.cnpj ? 'J' : 'F',
                        ncm: item.product?.ncm,
                        origin: 0,
                        emitState: 'SP'
                    });

                    const taxes = taxRepository.calculateItemTaxes({
                        vProduct: finalPrice,
                        qProduct: item.quantity,
                        isento_st: customer.isento_st || 0
                    }, { customer }, taxRules);

                    totalIPI += taxes.ipi;
                    totalST += taxes.st;
                    totalNet += finalPrice * item.quantity;

                    simulationResults.push({
                        id: item.productId,
                        name: item.name || item.model,
                        quantity: item.quantity,
                        unit_price_list: item.revenda,
                        unit_price_suggested_net: finalPrice,
                        unit_price_final_with_taxes: ((finalPrice * item.quantity) + taxes.ipi + taxes.st) / item.quantity,
                        discount_percent: item.revenda > 0 ? ((1 - (finalPrice / item.revenda)) * 100).toFixed(2) : 0,
                        decision_reason: decision?.reason || 'Calculado via Pricing Agent',
                        ipi: taxes.ipi,
                        st: taxes.st,
                        total_item: (finalPrice * item.quantity) + taxes.ipi + taxes.st
                    });
                }

                // 7. Formatar Resposta Final
                return JSON.stringify({
                    customer_name: customer.nome,
                    summary: {
                        subtotal_list: orderValue,
                        subtotal_suggested_net: totalNet,
                        total_discount_percent: orderValue > 0 ? ((1 - (totalNet / orderValue)) * 100).toFixed(2) : 0,
                        total_ipi: totalIPI,
                        total_st: totalST,
                        total_final_boleto: totalNet + totalIPI + totalST,
                        installments
                    },
                    items: simulationResults,
                    disclaimer: "Simulação baseada nas políticas comerciais vigentes e volume histórico do cliente."
                });

            } catch (error) {
                logger.error('Tool Error simulate_pricing:', error);
                return JSON.stringify({ error: error.message });
            }
        }
    }
};
