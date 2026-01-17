import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Leads Agent API',
      version: '1.0.0',
      description: 'API para sistema moderno de gestão de leads - Integrado com K3',
      contact: {
        name: 'Suporte',
        email: 'suporte@internut.com.br'
      },
      license: {
        name: 'Proprietary',
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido no login'
        }
      },
      schemas: {
        // Auth Schemas
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Username ou email do usuário',
              example: 'admin'
            },
            password: {
              type: 'string',
              description: 'Senha do usuário',
              example: 'senha123'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                user: { $ref: '#/components/schemas/User' }
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'admin' },
            name: { type: 'string', example: 'Administrador' },
            email: { type: 'string', example: 'admin@empresa.com' },
            segmento: { type: 'string', example: 'mak-prime' }
          }
        },

        // Lead Schemas
        Lead: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 12345 },
            customerId: { type: 'integer', example: 701546 },
            userId: { type: 'integer', example: 1 },
            sellerId: { type: 'integer', example: 1 },
            type: { type: 'integer', description: '1=Lead, 2=Pedido', example: 1 },
            orderWeb: { type: 'integer', nullable: true, description: 'Número do pedido após conversão' },
            cNatOp: { type: 'integer', description: 'Natureza de Operação', example: 27 },
            cEmitUnity: { type: 'integer', description: 'Unidade Emitente', example: 1 },
            cLogUnity: { type: 'integer', description: 'Unidade Logística', example: 1 },
            cTransporter: { type: 'integer', description: 'ID da Transportadora', example: 9 },
            paymentType: { type: 'integer', description: 'Tipo de pagamento', example: 1 },
            paymentTerms: { type: 'string', example: 'n:30:30' },
            freight: { type: 'number', example: 150.00 },
            freightType: { type: 'integer', description: '1=CIF, 2=FOB, 3=Terceiros', example: 1 },
            deliveryDate: { type: 'string', format: 'date', nullable: true },
            buyer: { type: 'string', nullable: true },
            purchaseOrder: { type: 'string', nullable: true },
            total: { type: 'number', example: 5000.00 },
            createdAt: { type: 'string', format: 'date-time' },
            customer: { $ref: '#/components/schemas/Customer' },
            remarks: { $ref: '#/components/schemas/LeadRemarks' }
          }
        },
        LeadRemarks: {
          type: 'object',
          properties: {
            finance: { type: 'string', example: 'Pagamento aprovado' },
            logistic: { type: 'string', example: 'Entregar pela manhã' },
            nfe: { type: 'string', example: 'CFOP especial' },
            obs: { type: 'string', example: 'Cliente VIP' },
            manager: { type: 'string', example: 'Aprovado pelo gerente' }
          }
        },
        CreateLeadRequest: {
          type: 'object',
          required: ['customerId', 'userId'],
          properties: {
            customerId: { type: 'integer', example: 701546 },
            userId: { type: 'integer', example: 1 },
            sellerId: { type: 'integer', example: 1 },
            cNatOp: { type: 'integer', default: 27 },
            cEmitUnity: { type: 'integer', default: 1 },
            cLogUnity: { type: 'integer', default: 1 },
            cTransporter: { type: 'integer', default: 9 },
            paymentType: { type: 'integer', default: 1 },
            paymentTerms: { type: 'string', default: 'n:30:30' },
            freight: { type: 'number', default: 0 },
            freightType: { type: 'integer', default: 1 },
            deliveryDate: { type: 'string', format: 'date', nullable: true },
            buyer: { type: 'string', nullable: true },
            purchaseOrder: { type: 'string', nullable: true },
            remarks: { $ref: '#/components/schemas/LeadRemarks' }
          }
        },

        // Cart Item Schemas
        CartItem: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            productId: { type: 'integer', example: 123456 },
            quantity: { type: 'number', example: 10 },
            price: { type: 'number', example: 150.00 },
            consumerPrice: { type: 'number', example: 180.00 },
            originalPrice: { type: 'number', example: 150.00 },
            times: { type: 'integer', example: 1 },
            ipi: { type: 'number', example: 15.00 },
            st: { type: 'number', example: 25.00 },
            ttd: { type: 'integer', description: '0=Normal, 1=TTD', example: 0 },
            subtotal: { type: 'number', example: 1500.00 },
            product: { $ref: '#/components/schemas/Product' }
          }
        },
        AddItemRequest: {
          type: 'object',
          required: ['productId', 'quantity', 'price'],
          properties: {
            productId: { type: 'integer', example: 123456 },
            quantity: { type: 'number', minimum: 0.01, example: 10 },
            price: { type: 'number', minimum: 0, example: 150.00 },
            consumerPrice: { type: 'number', example: 180.00 },
            originalPrice: { type: 'number', example: 150.00 },
            times: { type: 'integer', default: 1 },
            ipi: { type: 'number', default: 0 },
            st: { type: 'number', default: 0 },
            ttd: { type: 'integer', default: 0 }
          }
        },
        CartTotals: {
          type: 'object',
          properties: {
            itemCount: { type: 'integer', example: 5 },
            totalQuantity: { type: 'number', example: 50 },
            subtotal: { type: 'number', example: 5000.00 },
            totalIPI: { type: 'number', example: 500.00 },
            totalST: { type: 'number', example: 300.00 },
            freight: { type: 'number', example: 150.00 },
            grandTotal: { type: 'number', example: 5950.00 },
            profitability: {
              type: 'object',
              nullable: true,
              properties: {
                margin: { type: 'number' },
                commission: { type: 'number' },
                marginPercent: { type: 'number' }
              }
            }
          }
        },

        // Customer Schemas
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 701546 },
            nome: { type: 'string', example: 'Empresa Exemplo LTDA' },
            fantasia: { type: 'string', example: 'Empresa Exemplo' },
            cnpj: { type: 'string', example: '12.345.678/0001-90' },
            email: { type: 'string', example: 'contato@empresa.com' },
            telefone: { type: 'string', example: '(11) 99999-9999' },
            ender: { type: 'string', example: 'Rua das Flores, 123' },
            cidade: { type: 'string', example: 'São Paulo' },
            estado: { type: 'string', example: 'SP' },
            cep: { type: 'string', example: '01234-567' },
            tipo_pessoa: { type: 'string', enum: ['J', 'F'], example: 'J' }
          }
        },

        // Product Schemas
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 123456 },
            model: { type: 'string', example: 'ZJ-A8000' },
            brand: { type: 'string', example: 'ZOJE' },
            name: { type: 'string', example: 'Máquina de Costura Industrial' },
            description: { type: 'string' },
            price: { type: 'number', example: 2500.00 },
            category: { type: 'string', example: 'Máquinas' },
            segment: { type: 'string', example: 'ZOJE' },
            ncm: { type: 'string', example: '8452.21.10' }
          }
        },

        // Pricing Schemas
        PricingRequest: {
          type: 'object',
          required: ['org_id', 'brand_id', 'customer_id', 'sku_id', 'sku_qty', 'order_value', 'product_brand', 'product_model'],
          properties: {
            org_id: { type: 'integer', example: 1 },
            brand_id: { type: 'integer', example: 3755581063 },
            customer_id: { type: 'integer', example: 701546 },
            sku_id: { type: 'integer', example: 123456 },
            sku_qty: { type: 'number', example: 10 },
            order_value: { type: 'number', example: 1500.00 },
            product_brand: { type: 'string', example: 'ZOJE' },
            product_model: { type: 'string', example: 'ZJ-A8000' }
          }
        },
        PricingResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                result: {
                  type: 'object',
                  properties: {
                    decision: {
                      type: 'object',
                      properties: {
                        final_price: { type: 'number', example: 145.00 },
                        discount_allowed: { type: 'number', example: 0.15 },
                        applied_mode: { type: 'string', example: 'tier' },
                        tier_code: { type: 'string', example: 'A' }
                      }
                    }
                  }
                }
              }
            }
          }
        },

        // Metadata Schemas
        NOP: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 27 },
            name: { type: 'string', example: 'Venda de produção do estabelecimento' },
            tipo: { type: 'string' }
          }
        },
        Transporter: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 9 },
            name: { type: 'string', example: 'Transportadora XYZ' }
          }
        },
        Unit: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Rolemak SP' },
            UF: { type: 'string', example: 'SP' }
          }
        },

        // Common Schemas
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string', example: 'Validation error' },
                details: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 }
          }
        }
      }
    },
    security: [
      { bearerAuth: [] }
    ],
    tags: [
      { name: 'Auth', description: 'Autenticação e gerenciamento de sessão' },
      { name: 'Leads', description: 'Gestão de leads e carrinhos' },
      { name: 'Cart Items', description: 'Itens do carrinho de um lead' },
      { name: 'Customers', description: 'Busca e consulta de clientes' },
      { name: 'Products', description: 'Busca e consulta de produtos' },
      { name: 'Pricing', description: 'Cálculo de preços' },
      { name: 'Metadata', description: 'Dados auxiliares do sistema' }
    ]
  },
  apis: ['./src/routes/*.js']
};

export const swaggerSpec = swaggerJsdoc(options);


