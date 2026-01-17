import express from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import * as customersController from '../controllers/customers.controller.js';

const router = express.Router();

/**
 * @swagger
 * /customers/my-portfolio:
 *   get:
 *     summary: Lista clientes da carteira do vendedor logado
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca (nome, fantasia, CNPJ, cidade)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, at_risk, inactive]
 *         description: Filtrar por status
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [nome, last_order_date, year_total, month_total, limite]
 *         description: Campo para ordenação
 *       - in: query
 *         name: sortDir
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Direção da ordenação
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lista de clientes da carteira
 */
router.get('/my-portfolio', authenticateToken, customersController.getMyPortfolio);

/**
 * @swagger
 * /customers/my-portfolio/summary:
 *   get:
 *     summary: Obtém resumo da carteira do vendedor logado
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumo da carteira
 */
router.get('/my-portfolio/summary', authenticateToken, customersController.getMyPortfolioSummary);

/**
 * @swagger
 * /customers/my-portfolio/export:
 *   get:
 *     summary: Exportar carteira em CSV
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Arquivo CSV
 */
router.get('/my-portfolio/export', authenticateToken, customersController.exportPortfolio);

/**
 * @swagger
 * /customers/sellers:
 *   get:
 *     summary: Lista vendedores disponíveis (apenas gerentes)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Retorna lista de vendedores com clientes para gerentes (level > 4).
 *       Permite que gerentes selecionem qual carteira visualizar.
 *     responses:
 *       200:
 *         description: Lista de vendedores
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
 *                       email:
 *                         type: string
 *                       customersCount:
 *                         type: integer
 *                       yearTotal:
 *                         type: number
 *       403:
 *         description: Acesso restrito a gerentes
 */
router.get('/sellers', authenticateToken, customersController.getSellers);

/**
 * @swagger
 * /customers/sellers/segments:
 *   get:
 *     summary: Lista segmentos disponíveis de vendedores
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de segmentos
 */
router.get('/sellers/segments', authenticateToken, customersController.getSellerSegments);

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Busca clientes com filtros e paginação
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca (nome, fantasia, CNPJ, cidade)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtrar por estado (UF)
 *       - in: query
 *         name: cidade
 *         schema:
 *           type: string
 *         description: Filtrar por cidade
 *       - in: query
 *         name: vendedor
 *         schema:
 *           type: integer
 *         description: Filtrar por vendedor
 *       - in: query
 *         name: tipo_pessoa
 *         schema:
 *           type: string
 *           enum: [J, F]
 *         description: J=Jurídica, F=Física
 *       - in: query
 *         name: simple
 *         schema:
 *           type: string
 *           enum: ['1', '0']
 *         description: Se '1', retorna campos reduzidos
 *     responses:
 *       200:
 *         description: Lista de clientes
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
 *                     $ref: '#/components/schemas/Customer'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', optionalAuth, customersController.searchCustomers);

/**
 * @swagger
 * /customers/recent:
 *   get:
 *     summary: Lista clientes recentes
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Quantidade de clientes a retornar
 *     responses:
 *       200:
 *         description: Lista de clientes recentes
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
 *                     $ref: '#/components/schemas/Customer'
 */
router.get('/recent', optionalAuth, customersController.getRecentCustomers);

/**
 * @swagger
 * /customers/cnpj/{cnpj}:
 *   get:
 *     summary: Busca cliente por CNPJ
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cnpj
 *         required: true
 *         schema:
 *           type: string
 *         description: CNPJ do cliente (com ou sem formatação)
 *     responses:
 *       200:
 *         description: Dados do cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Cliente não encontrado
 */
router.get('/cnpj/:cnpj', optionalAuth, customersController.getCustomerByCnpj);

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Busca cliente por ID
 *     tags: [Customers]
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
 *         description: Dados do cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Cliente não encontrado
 */
router.get('/:id', optionalAuth, customersController.getCustomerById);

/**
 * @swagger
 * /customers/{id}/orders:
 *   get:
 *     summary: Histórico de pedidos do cliente
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filtrar por ano
 *     responses:
 *       200:
 *         description: Lista de pedidos do cliente
 */
router.get('/:id/orders', authenticateToken, customersController.getCustomerOrders);

/**
 * @swagger
 * /customers/{id}/leads:
 *   get:
 *     summary: Leads/cotações do cliente
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, converted, cancelled]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de leads do cliente
 */
router.get('/:id/leads', authenticateToken, customersController.getCustomerLeads);

/**
 * @swagger
 * /customers/{id}/metrics:
 *   get:
 *     summary: Métricas do cliente
 *     tags: [Customers]
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
 *         description: Métricas completas do cliente
 */
router.get('/:id/metrics', authenticateToken, customersController.getCustomerMetrics);

/**
 * @swagger
 * /customers/{id}/products:
 *   get:
 *     summary: Produtos mais comprados pelo cliente
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de produtos mais comprados
 */
router.get('/:id/products', authenticateToken, customersController.getCustomerTopProducts);

export default router;
