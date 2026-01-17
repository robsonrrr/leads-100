import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as leadsController from '../controllers/leads.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /leads:
 *   get:
 *     summary: Lista leads com paginação e filtros
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Itens por página
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *         description: Filtrar por cliente
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filtrar por usuário criador
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: integer
 *         description: Filtrar por vendedor
 *       - in: query
 *         name: type
 *         schema:
 *           type: integer
 *           enum: [1, 2]
 *         description: 1=Lead, 2=Pedido
 *       - in: query
 *         name: cSegment
 *         schema:
 *           type: string
 *         description: Filtrar por segmento
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: total
 *         description: Campo para ordenação
 *       - in: query
 *         name: sortDir
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Direção da ordenação
 *       - in: query
 *         name: includeTotal
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir contagem total (mais lento)
 *     responses:
 *       200:
 *         description: Lista de leads
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lead'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', leadsController.getLeads);

/**
 * @swagger
 * /leads/export:
 *   get:
 *     summary: Exporta leads para Excel
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: leadId
 *         schema:
 *           type: integer
 *         description: ID do lead (para exportar um único lead com detalhes)
 *       - in: query
 *         name: type
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3]
 *         description: 1=Em Aberto, 2=Convertido, 3=Cancelado
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (YYYY-MM-DD)
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (YYYY-MM-DD)
 *       - in: query
 *         name: cSegment
 *         schema:
 *           type: string
 *         description: Filtrar por segmento
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 1000
 *           maximum: 1000
 *         description: Limite de registros (máx 1000)
 *     responses:
 *       200:
 *         description: Arquivo Excel
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/export', leadsController.exportLeads);

/**
 * @swagger
 * /leads/segments:
 *   get:
 *     summary: Lista segmentos únicos dos leads
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de segmentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/segments', leadsController.getSegments);

/**
 * @swagger
 * /leads/metadata/nops:
 *   get:
 *     summary: Lista Naturezas de Operação disponíveis
 *     tags: [Metadata]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de NOPs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NOP'
 */
router.get('/metadata/nops', leadsController.getNops);

/**
 * @swagger
 * /leads/metadata/payment-types:
 *   get:
 *     summary: Lista Tipos de Pagamento disponíveis
 *     tags: [Metadata]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tipos de pagamento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 */
router.get('/metadata/payment-types', leadsController.getPaymentTypes);

/**
 * @swagger
 * /leads/metadata/payment-terms:
 *   get:
 *     summary: Lista Prazos de Pagamento disponíveis
 *     tags: [Metadata]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de prazos de pagamento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 */
router.get('/metadata/payment-terms', leadsController.getPaymentTerms);

/**
 * @swagger
 * /leads/metadata/transporters:
 *   get:
 *     summary: Lista Transportadoras disponíveis
 *     tags: [Metadata]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de transportadoras
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transporter'
 */
router.get('/metadata/transporters', leadsController.getTransporters);

/**
 * @swagger
 * /leads/metadata/units:
 *   get:
 *     summary: Lista Unidades Emitentes disponíveis
 *     tags: [Metadata]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de unidades
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Unit'
 */
router.get('/metadata/units', leadsController.getUnits);

/**
 * @swagger
 * /leads/metadata/customer-transporter:
 *   get:
 *     summary: Busca a transportadora mais usada por um cliente
 *     tags: [Metadata]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Transportadora mais usada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     usageCount:
 *                       type: integer
 *                     lastUsed:
 *                       type: string
 *                       format: date-time
 */
router.get('/metadata/customer-transporter', leadsController.getCustomerTransporter);

/**
 * @swagger
 * /leads/{id}:
 *   get:
 *     summary: Busca um lead por ID
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do lead
 *     responses:
 *       200:
 *         description: Dados do lead
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Lead'
 *       404:
 *         description: Lead não encontrado
 */
router.get('/:id', leadsController.getLeadById);

/**
 * @swagger
 * /leads:
 *   post:
 *     summary: Cria um novo lead
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLeadRequest'
 *     responses:
 *       201:
 *         description: Lead criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Lead'
 *                 message:
 *                   type: string
 *       400:
 *         description: Erro de validação
 */
router.post('/', leadsController.createLead);

/**
 * @swagger
 * /leads/{id}:
 *   put:
 *     summary: Atualiza um lead existente
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLeadRequest'
 *     responses:
 *       200:
 *         description: Lead atualizado
 *       404:
 *         description: Lead não encontrado
 */
router.put('/:id', leadsController.updateLead);

/**
 * @swagger
 * /leads/{id}:
 *   delete:
 *     summary: Remove um lead
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lead removido
 *       404:
 *         description: Lead não encontrado
 */
router.delete('/:id', leadsController.deleteLead);

/**
 * @swagger
 * /leads/{id}/items:
 *   get:
 *     summary: Lista itens do carrinho de um lead
 *     tags: [Cart Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do lead
 *     responses:
 *       200:
 *         description: Lista de itens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CartItem'
 */
router.get('/:id/items', leadsController.getLeadItems);

/**
 * @swagger
 * /leads/{id}/items:
 *   post:
 *     summary: Adiciona um item ao carrinho
 *     tags: [Cart Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddItemRequest'
 *     responses:
 *       201:
 *         description: Item adicionado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CartItem'
 */
router.post('/:id/items', leadsController.addItem);

/**
 * @swagger
 * /leads/{id}/items/{itemId}:
 *   put:
 *     summary: Atualiza um item do carrinho
 *     tags: [Cart Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do lead
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddItemRequest'
 *     responses:
 *       200:
 *         description: Item atualizado
 *       404:
 *         description: Item não encontrado
 */
router.put('/:id/items/:itemId', leadsController.updateItem);

/**
 * @swagger
 * /leads/{id}/items/{itemId}:
 *   delete:
 *     summary: Remove um item do carrinho
 *     tags: [Cart Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item removido
 *       404:
 *         description: Item não encontrado
 */
router.delete('/:id/items/:itemId', leadsController.removeItem);

/**
 * @swagger
 * /leads/{id}/totals:
 *   get:
 *     summary: Calcula totais do carrinho
 *     tags: [Cart Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Totais calculados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CartTotals'
 */
router.get('/:id/totals', leadsController.calculateTotals);

/**
 * @swagger
 * /leads/{id}/taxes:
 *   post:
 *     summary: Calcula impostos para todos os itens do lead
 *     tags: [Cart Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Impostos calculados e atualizados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       itemId:
 *                         type: integer
 *                       product:
 *                         type: string
 *                       ipi:
 *                         type: number
 *                       st:
 *                         type: number
 *                 message:
 *                   type: string
 */
router.post('/:id/taxes', leadsController.calculateLeadTaxes);

/**
 * @swagger
 * /leads/{id}/convert:
 *   post:
 *     summary: Converte lead em pedido oficial
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lead convertido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: integer
 *                       description: ID do pedido gerado
 *                 message:
 *                   type: string
 *       400:
 *         description: Lead já convertido ou sem itens
 *       404:
 *         description: Lead não encontrado
 */
router.post('/:id/convert', leadsController.convertToOrder);

export default router;
