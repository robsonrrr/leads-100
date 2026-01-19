/**
 * Tasks Controller
 * API endpoints for Daily Tasks system
 */
import logger from '../../config/logger.js';
import { taskEngine } from '../services/tasks/TaskEngine.js';
import { tasksRepository } from '../repositories/tasks.repository.js';

export class TasksController {
    /**
     * POST /api/v2/tasks/generate
     * Generate daily tasks for the authenticated seller
     */
    async generate(req, res) {
        try {
            const sellerId = req.user?.userId || req.user?.userId || req.user?.vendedor_id || req.user?.id;
            const { date } = req.body;

            logger.info('TasksController: Generate request', { sellerId, date });

            const result = await taskEngine.generate(sellerId, date);

            res.json({
                success: result.success,
                cached: result.cached,
                run_id: result.runId,
                task_count: result.tasks?.length || 0,
                stats: result.stats
            });

        } catch (error) {
            logger.error('TasksController: Generate error', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * GET /api/v2/tasks/today
     * Get today's tasks for the authenticated seller
     */
    async getToday(req, res) {
        try {
            const requesterId = req.user?.userId || req.user?.vendedor_id || req.user?.id;
            const requesterLevel = req.user?.nivel || req.user?.level || 1;
            const date = req.query.date || new Date().toISOString().split('T')[0];

            logger.info('TasksController: GetToday request', { requesterId, date });

            const result = await taskEngine.getTasks(requesterId, requesterLevel, null, date);

            res.json({
                success: true,
                ...result
            });

        } catch (error) {
            logger.error('TasksController: GetToday error', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * GET /api/v2/tasks/today/:sellerId
     * Get today's tasks for a specific seller (manager view)
     */
    async getSellerTasks(req, res) {
        try {
            const requesterId = req.user?.userId || req.user?.vendedor_id || req.user?.id;
            const requesterLevel = req.user?.nivel || req.user?.level || 1;
            const { sellerId } = req.params;
            const date = req.query.date || new Date().toISOString().split('T')[0];

            logger.info('TasksController: GetSellerTasks request', {
                requesterId,
                sellerId,
                date
            });

            const result = await taskEngine.getTasks(
                requesterId,
                requesterLevel,
                parseInt(sellerId),
                date
            );

            res.json({
                success: true,
                ...result
            });

        } catch (error) {
            logger.error('TasksController: GetSellerTasks error', error);

            if (error.message.includes('FORBIDDEN')) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied'
                });
            }

            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * GET /api/v2/tasks/:taskId
     * Get a specific task by ID
     */
    async getTask(req, res) {
        try {
            const requesterId = req.user?.userId || req.user?.vendedor_id || req.user?.id;
            const requesterLevel = req.user?.nivel || req.user?.level || 1;
            const { taskId } = req.params;

            const task = await tasksRepository.getTaskById(parseInt(taskId));

            if (!task) {
                return res.status(404).json({
                    success: false,
                    error: 'Task not found'
                });
            }

            // RBAC check
            if (requesterLevel < 4 && task.seller_id !== requesterId) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied'
                });
            }

            res.json({
                success: true,
                task
            });

        } catch (error) {
            logger.error('TasksController: GetTask error', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * PATCH /api/v2/tasks/:taskId/start
     * Mark task as IN_PROGRESS
     */
    async startTask(req, res) {
        try {
            const actorId = req.user?.userId || req.user?.vendedor_id || req.user?.id;
            const actorLevel = req.user?.nivel || req.user?.level || 1;
            const { taskId } = req.params;

            const task = await taskEngine.updateTaskStatus(
                parseInt(taskId),
                'IN_PROGRESS',
                actorId,
                actorLevel
            );

            res.json({
                success: true,
                task
            });

        } catch (error) {
            logger.error('TasksController: StartTask error', error);

            if (error.message.includes('FORBIDDEN')) {
                return res.status(403).json({ success: false, error: 'Access denied' });
            }
            if (error.message.includes('NOT_FOUND')) {
                return res.status(404).json({ success: false, error: 'Task not found' });
            }
            if (error.message.includes('INVALID_TRANSITION')) {
                return res.status(400).json({ success: false, error: error.message });
            }

            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * PATCH /api/v2/tasks/:taskId/done
     * Mark task as DONE with outcome
     */
    async completeTask(req, res) {
        try {
            const actorId = req.user?.userId || req.user?.vendedor_id || req.user?.id;
            const actorLevel = req.user?.nivel || req.user?.level || 1;
            const { taskId } = req.params;
            const {
                outcome_code,
                outcome_reason_code,
                outcome_note,
                outcome_json
            } = req.body;

            const task = await taskEngine.updateTaskStatus(
                parseInt(taskId),
                'DONE',
                actorId,
                actorLevel,
                {
                    outcomeCode: outcome_code,
                    outcomeReasonCode: outcome_reason_code,
                    outcomeNote: outcome_note,
                    outcomeJson: outcome_json
                }
            );

            res.json({
                success: true,
                task
            });

        } catch (error) {
            logger.error('TasksController: CompleteTask error', error);

            if (error.message.includes('FORBIDDEN')) {
                return res.status(403).json({ success: false, error: 'Access denied' });
            }
            if (error.message.includes('NOT_FOUND')) {
                return res.status(404).json({ success: false, error: 'Task not found' });
            }
            if (error.message.includes('REQUIRED')) {
                return res.status(400).json({ success: false, error: error.message });
            }
            if (error.message.includes('INVALID_TRANSITION')) {
                return res.status(400).json({ success: false, error: error.message });
            }

            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * PATCH /api/v2/tasks/:taskId/snooze
     * Snooze task until specified time
     */
    async snoozeTask(req, res) {
        try {
            const actorId = req.user?.userId || req.user?.vendedor_id || req.user?.id;
            const actorLevel = req.user?.nivel || req.user?.level || 1;
            const { taskId } = req.params;
            const { snooze_until, note } = req.body;

            if (!snooze_until) {
                return res.status(400).json({
                    success: false,
                    error: 'snooze_until is required'
                });
            }

            const task = await taskEngine.updateTaskStatus(
                parseInt(taskId),
                'SNOOZED',
                actorId,
                actorLevel,
                {
                    snoozedUntil: snooze_until,
                    note
                }
            );

            res.json({
                success: true,
                task
            });

        } catch (error) {
            logger.error('TasksController: SnoozeTask error', error);

            if (error.message.includes('FORBIDDEN')) {
                return res.status(403).json({ success: false, error: 'Access denied' });
            }

            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * DELETE /api/v2/tasks/:taskId
     * Cancel a task
     */
    async cancelTask(req, res) {
        try {
            const actorId = req.user?.userId || req.user?.vendedor_id || req.user?.id;
            const actorLevel = req.user?.nivel || req.user?.level || 1;
            const { taskId } = req.params;
            const { note } = req.body;

            const task = await taskEngine.updateTaskStatus(
                parseInt(taskId),
                'CANCELLED',
                actorId,
                actorLevel,
                { note }
            );

            res.json({
                success: true,
                task
            });

        } catch (error) {
            logger.error('TasksController: CancelTask error', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/v2/tasks/stats
     * Get task statistics
     */
    async getStats(req, res) {
        try {
            const requesterId = req.user?.userId || req.user?.vendedor_id || req.user?.id;
            const requesterLevel = req.user?.nivel || req.user?.level || 1;
            const { seller_id, start_date, end_date } = req.query;

            const targetSellerId = requesterLevel >= 4 && seller_id
                ? parseInt(seller_id)
                : requesterId;

            const stats = await taskEngine.getStats(
                targetSellerId,
                start_date,
                end_date
            );

            res.json({
                success: true,
                seller_id: targetSellerId,
                stats
            });

        } catch (error) {
            logger.error('TasksController: GetStats error', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/v2/tasks/sla-breaches
     * Get SLA breaches
     */
    async getSlaBreaches(req, res) {
        try {
            const requesterId = req.user?.userId || req.user?.vendedor_id || req.user?.id;
            const requesterLevel = req.user?.nivel || req.user?.level || 1;
            const { seller_id } = req.query;

            const targetSellerId = requesterLevel >= 4
                ? (seller_id ? parseInt(seller_id) : null)
                : requesterId;

            const breaches = await taskEngine.getSlaBreaches(targetSellerId);

            res.json({
                success: true,
                breaches
            });

        } catch (error) {
            logger.error('TasksController: GetSlaBreaches error', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/v2/tasks/outcomes
     * Get available outcome reason codes
     */
    async getOutcomeReasons(req, res) {
        try {
            const { outcome_code } = req.query;
            const reasons = await taskEngine.getOutcomeReasons(outcome_code);

            res.json({
                success: true,
                reasons
            });

        } catch (error) {
            logger.error('TasksController: GetOutcomeReasons error', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/v2/tasks/rules
     * Get task rules (admin)
     */
    async getRules(req, res) {
        try {
            const requesterLevel = req.user?.nivel || req.user?.level || 1;

            if (requesterLevel < 5) {
                return res.status(403).json({
                    success: false,
                    error: 'Admin access required'
                });
            }

            const rules = await tasksRepository.getActiveRules();

            res.json({
                success: true,
                rules
            });

        } catch (error) {
            logger.error('TasksController: GetRules error', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export const tasksController = new TasksController();
