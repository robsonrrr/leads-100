/**
 * Routes para Sistema de Metas
 */
import { Router } from 'express';
import * as goalsController from '../controllers/goals.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /goals/my-progress:
 *   get:
 *     summary: Meu progresso vs meta
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 */
router.get('/my-progress', authenticateToken, goalsController.getMyProgress);

/**
 * @swagger
 * /goals/team-progress:
 *   get:
 *     summary: Progresso da equipe (apenas gerentes)
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 */
router.get('/team-progress', authenticateToken, goalsController.getTeamProgress);

/**
 * @swagger
 * /goals/seller/{sellerId}:
 *   get:
 *     summary: Metas de um vendedor
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 */
router.get('/seller/:sellerId', authenticateToken, goalsController.getSellerGoals);

/**
 * @swagger
 * /goals:
 *   get:
 *     summary: Listar todas as metas (apenas gerentes)
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, goalsController.getAllGoals);

/**
 * @swagger
 * /goals:
 *   post:
 *     summary: Criar meta (apenas gerentes)
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticateToken, goalsController.createGoal);

/**
 * @swagger
 * /goals/{id}:
 *   put:
 *     summary: Atualizar meta (apenas gerentes)
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authenticateToken, goalsController.updateGoal);

/**
 * @swagger
 * /goals/{id}:
 *   delete:
 *     summary: Excluir meta (apenas gerentes)
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticateToken, goalsController.deleteGoal);

export default router;
