/**
 * Tasks Routes
 * API routes for Daily Tasks system
 * 
 * Base path: /api/v2/tasks
 */
import { Router } from 'express';
import { authenticateToken as auth } from '../../middleware/auth.js';
import { tasksController } from '../controllers/tasks.controller.js';

const router = Router();

// Static routes MUST come before dynamic :param routes!

// Stats and analytics (static paths) - require auth
router.get('/stats', auth, (req, res) => tasksController.getStats(req, res));
router.get('/sla-breaches', auth, (req, res) => tasksController.getSlaBreaches(req, res));

// Outcome reasons (static path) - require auth
router.get('/outcomes', auth, (req, res) => tasksController.getOutcomeReasons(req, res));

// Admin - Rules management (static path) - require auth
router.get('/rules', auth, (req, res) => tasksController.getRules(req, res));

// Task generation and retrieval - require auth
router.post('/generate', auth, (req, res) => tasksController.generate(req, res));
router.get('/today', auth, (req, res) => tasksController.getToday(req, res));
router.get('/today/:sellerId', auth, (req, res) => tasksController.getSellerTasks(req, res));

// Task details and actions (dynamic :taskId - must come last!) - require auth
router.get('/:taskId', auth, (req, res) => tasksController.getTask(req, res));
router.patch('/:taskId/start', auth, (req, res) => tasksController.startTask(req, res));
router.patch('/:taskId/done', auth, (req, res) => tasksController.completeTask(req, res));
router.patch('/:taskId/snooze', auth, (req, res) => tasksController.snoozeTask(req, res));
router.delete('/:taskId', auth, (req, res) => tasksController.cancelTask(req, res));

export default router;
