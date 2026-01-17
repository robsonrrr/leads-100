/**
 * Routes para interações com clientes
 */
import { Router } from 'express';
import * as interactionsController from '../controllers/interactions.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /interactions/customer/{customerId}:
 *   get:
 *     summary: Lista interações de um cliente
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 */
router.get('/customer/:customerId', authenticateToken, interactionsController.getCustomerInteractions);

/**
 * @swagger
 * /interactions:
 *   post:
 *     summary: Criar nova interação
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticateToken, interactionsController.createInteraction);

/**
 * @swagger
 * /interactions/{id}:
 *   put:
 *     summary: Atualizar interação
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authenticateToken, interactionsController.updateInteraction);

/**
 * @swagger
 * /interactions/{id}:
 *   delete:
 *     summary: Deletar interação
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticateToken, interactionsController.deleteInteraction);

/**
 * @swagger
 * /interactions/follow-ups:
 *   get:
 *     summary: Lista próximas ações (follow-ups)
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 */
router.get('/follow-ups', authenticateToken, interactionsController.getFollowUps);

/**
 * @swagger
 * /interactions/follow-ups/count:
 *   get:
 *     summary: Conta follow-ups pendentes
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 */
router.get('/follow-ups/count', authenticateToken, interactionsController.getFollowUpsCount);

export default router;
