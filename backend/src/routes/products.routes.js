import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import * as productsController from '../controllers/products.controller.js';

const router = express.Router();

/**
 * @swagger
 * /products/categories:
 *   get:
 *     summary: Lista categorias de produtos disponíveis
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorias
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
router.get('/categories', optionalAuth, productsController.getCategories);

/**
 * @swagger
 * /products/segments:
 *   get:
 *     summary: Lista segmentos de produtos disponíveis
 *     tags: [Products]
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
router.get('/segments', optionalAuth, productsController.getSegments);

/**
 * @swagger
 * /products/category/{category}:
 *   get:
 *     summary: Lista produtos por categoria
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome da categoria
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Lista de produtos da categoria
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
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/category/:category', optionalAuth, productsController.getProductsByCategory);

/**
 * @swagger
 * /products/segment/{segment}:
 *   get:
 *     summary: Lista produtos por segmento
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: segment
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome do segmento
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Lista de produtos do segmento
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
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/segment/:segment', optionalAuth, productsController.getProductsBySegment);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Busca produtos com filtros e paginação
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca (modelo, nome, descrição, NCM)
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
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: segment
 *         schema:
 *           type: string
 *         description: Filtrar por segmento
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filtrar por marca
 *       - in: query
 *         name: simple
 *         schema:
 *           type: string
 *           enum: ['1', '0']
 *         description: Se '1', retorna campos reduzidos
 *     responses:
 *       200:
 *         description: Lista de produtos
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
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', optionalAuth, productsController.searchProducts);

/**
 * @swagger
 * /products/favorites:
 *   get:
 *     summary: Lista produtos favoritos do vendedor
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de produtos favoritos
 */
router.get('/favorites', optionalAuth, productsController.getFavorites);

/**
 * @swagger
 * /products/{id}/favorite:
 *   post:
 *     summary: Adiciona produto aos favoritos
 *     tags: [Products]
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
 *         description: Produto adicionado aos favoritos
 */
router.post('/:id/favorite', optionalAuth, productsController.addFavorite);

/**
 * @swagger
 * /products/{id}/favorite:
 *   delete:
 *     summary: Remove produto dos favoritos
 *     tags: [Products]
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
 *         description: Produto removido dos favoritos
 */
router.delete('/:id/favorite', optionalAuth, productsController.removeFavorite);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Busca produto por ID
 *     tags: [Products]
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
 *         description: Dados do produto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Produto não encontrado
 */
router.get('/:id', optionalAuth, productsController.getProductById);

/**
 * @swagger
 * /products/{id}/details:
 *   get:
 *     summary: Busca dados enriquecidos do produto (para modal de detalhes)
 *     tags: [Products]
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
 *         description: Dados completos do produto com informações de catálogo
 */
router.get('/:id/details', optionalAuth, productsController.getEnrichedProductById);

/**
 * @openapi
 * /api/products/{id}/stock-by-warehouse:
 *   get:
 *     summary: Busca estoque por unidade/depósito
 *     tags:
 *       - Produtos
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estoque detalhado por unidade
 */
router.get('/:id/stock-by-warehouse', optionalAuth, productsController.getStockByWarehouse);

export default router;

