import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as ordersController from '../controllers/orders.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Busca um pedido por ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Dados do pedido
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
 *                       description: ID do pedido
 *                     orderWeb:
 *                       type: integer
 *                       description: Número do pedido web
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: Data de criação
 *                     customerId:
 *                       type: integer
 *                       description: ID do cliente
 *                     customer:
 *                       type: object
 *                       description: Dados do cliente
 *                     freight:
 *                       type: number
 *                       description: Valor do frete
 *                     deliveryDate:
 *                       type: string
 *                       format: date-time
 *                       description: Data de entrega
 *                     paymentType:
 *                       type: integer
 *                       description: Tipo de pagamento
 *                     paymentTerms:
 *                       type: string
 *                       description: Condições de pagamento
 *                     transporter:
 *                       type: object
 *                       description: Dados da transportadora
 *                     remarks:
 *                       type: object
 *                       description: Observações do pedido
 *                     subtotal:
 *                       type: number
 *                       description: Subtotal
 *                     totalIPI:
 *                       type: number
 *                       description: Total IPI
 *                     totalST:
 *                       type: number
 *                       description: Total ST
 *                     total:
 *                       type: number
 *                       description: Valor total
 *                     items:
 *                       type: array
 *                       description: Itens do pedido
 *                       items:
 *                         type: object
 *       404:
 *         description: Pedido não encontrado
 *       400:
 *         description: ID inválido
 */
router.get('/:id', ordersController.getOrderById);

export default router;
