/**
 * Task Engine
 * Main orchestrator for Daily Tasks OODA Loop
 * 
 * Coordinates the full pipeline:
 * 1. OBSERVE: Collect signals
 * 2. NORMALIZE: Calculate features
 * 3. ORIENT: Build orientation snapshots
 * 4. DECIDE: Generate task candidates from rules
 * 5. ACT: Apply guardrails, limits, and publish tasks
 * 6. TELEMETRY: Log everything for learning
 */
import { getDatabase } from '../../../config/database.js';
import logger from '../../../config/logger.js';
import { tasksRepository } from '../../repositories/tasks.repository.js';
import { signalCollector } from './SignalCollector.js';
import { featureCalculator } from './FeatureCalculator.js';
import { orientationService } from './OrientationService.js';
import { rulesEngine } from './RulesEngine.js';

const db = () => getDatabase();

// Task limits per bucket
const BUCKET_LIMITS = {
    CRITICAL: 3,
    OPPORTUNITY: 5,
    HYGIENE: 3
};

export class TaskEngine {
    /**
     * Generate daily tasks for a seller
     * Idempotent: if already generated for today, returns cached result
     * 
     * @param {number} sellerId - The seller ID
     * @param {string} runDate - Optional date (YYYY-MM-DD), defaults to today
     * @returns {Object} Result with tasks and stats
     */
    async generate(sellerId, runDate = null) {
        const date = runDate || new Date().toISOString().split('T')[0];

        logger.info('TaskEngine: Starting generation', { sellerId, date });
        const startTime = Date.now();

        try {
            // 1. Get or create run (idempotent)
            const { run, isNew } = await tasksRepository.getOrCreateRun(sellerId, date);

            if (!isNew && run.status === 'DONE') {
                // Already generated - return cached tasks
                logger.info('TaskEngine: Returning cached tasks', { runId: run.run_id });
                const tasks = await tasksRepository.getTasksForSellerDate(sellerId, date);
                let statsJson = null;
                if (run.stats_json) {
                    try {
                        statsJson = typeof run.stats_json === 'string'
                            ? JSON.parse(run.stats_json)
                            : run.stats_json;
                    } catch (e) {
                        statsJson = null;
                    }
                }
                return {
                    success: true,
                    cached: true,
                    runId: run.run_id,
                    tasks,
                    stats: statsJson
                };
            }

            if (!isNew && run.status === 'RUNNING') {
                // Already running - wait or return current state
                logger.warn('TaskEngine: Run already in progress', { runId: run.run_id });
                return {
                    success: false,
                    error: 'ALREADY_RUNNING',
                    runId: run.run_id
                };
            }

            // 2. Execute OODA pipeline
            const stats = await this._executePipeline(run.run_id, sellerId, date);

            // 3. Mark run as done
            await tasksRepository.updateRunStatus(run.run_id, 'DONE', stats);

            // 4. Get generated tasks
            const tasks = await tasksRepository.getTasksForSellerDate(sellerId, date);

            const duration = Date.now() - startTime;
            logger.info('TaskEngine: Generation complete', {
                sellerId,
                runId: run.run_id,
                taskCount: tasks.length,
                duration
            });

            return {
                success: true,
                cached: false,
                runId: run.run_id,
                tasks,
                stats: {
                    ...stats,
                    duration_ms: duration
                }
            };

        } catch (error) {
            logger.error('TaskEngine: Generation failed', { sellerId, error: error.message });

            // Try to mark run as failed if we have a run_id
            try {
                const { run } = await tasksRepository.getOrCreateRun(sellerId, date);
                if (run) {
                    await tasksRepository.updateRunStatus(run.run_id, 'FAILED', null, error.message);
                }
            } catch (e) {
                // Ignore
            }

            throw error;
        }
    }

    /**
     * Execute the OODA pipeline
     */
    async _executePipeline(runId, sellerId, runDate) {
        const stats = {
            observe: {},
            normalize: {},
            orient: {},
            decide: {},
            act: {}
        };

        // 1. OBSERVE: Collect signals
        logger.debug('TaskEngine: OBSERVE phase', { runId });
        stats.observe = await signalCollector.collectAll(runId, sellerId);

        // 2. NORMALIZE: Calculate features
        logger.debug('TaskEngine: NORMALIZE phase', { runId });
        stats.normalize = await featureCalculator.calculate(runId, sellerId);

        // 3. ORIENT: Build orientation snapshots
        logger.debug('TaskEngine: ORIENT phase', { runId });
        stats.orient = await orientationService.buildSnapshots(runId, sellerId);

        // 4. DECIDE: Generate task candidates
        logger.debug('TaskEngine: DECIDE phase', { runId });
        const candidates = await rulesEngine.generateCandidates(runId, sellerId);
        stats.decide = {
            candidates_total: candidates.length,
            by_bucket: {}
        };

        // 5. ACT: Apply guardrails and create tasks
        logger.debug('TaskEngine: ACT phase', { runId });
        stats.act = await this._applyGuardrailsAndPublish(runId, sellerId, runDate, candidates);

        return stats;
    }

    /**
     * Apply guardrails, bucket limits, and publish tasks
     */
    async _applyGuardrailsAndPublish(runId, sellerId, runDate, candidates) {
        const stats = {
            published: { CRITICAL: 0, OPPORTUNITY: 0, HYGIENE: 0 },
            backlog: { CRITICAL: 0, OPPORTUNITY: 0, HYGIENE: 0 },
            deduped: 0
        };

        // Get orientation refs
        const [snapshots] = await db().execute(
            `SELECT customer_id, snapshot_id FROM staging.sales_orientation_snapshot WHERE run_id = ?`,
            [runId]
        );
        const orientationMap = {};
        for (const s of snapshots) {
            orientationMap[s.customer_id] = s.snapshot_id;
        }

        // Group candidates by bucket
        const byBucket = {
            CRITICAL: [],
            OPPORTUNITY: [],
            HYGIENE: []
        };

        for (const candidate of candidates) {
            const bucket = candidate.rule.task_bucket;
            byBucket[bucket].push(candidate);
        }

        // Sort each bucket by score (descending) and apply limits
        for (const bucket of ['CRITICAL', 'OPPORTUNITY', 'HYGIENE']) {
            const sorted = byBucket[bucket].sort((a, b) => b.score - a.score);
            const limit = BUCKET_LIMITS[bucket];

            for (let i = 0; i < sorted.length; i++) {
                const candidate = sorted[i];
                const task = rulesEngine.buildTask(candidate, runDate);

                // Set orientation reference
                task.orientationRef = orientationMap[candidate.customerId] || null;

                // Determine status: OPEN or BACKLOG
                if (i < limit) {
                    task.status = 'OPEN';
                } else {
                    task.status = 'BACKLOG';
                    // Add overflow reason to guardrail
                    task.guardrailJson = {
                        ...(task.guardrailJson || {}),
                        overflow_reason: `exceeded_${bucket.toLowerCase()}_limit_of_${limit}`
                    };
                }

                // Create task (with dedup)
                const result = await tasksRepository.createTask(runId, task);

                if (result.isNew) {
                    if (task.status === 'OPEN') {
                        stats.published[bucket]++;
                    } else {
                        stats.backlog[bucket]++;
                    }
                } else {
                    stats.deduped++;
                }
            }
        }

        return stats;
    }

    /**
     * Get tasks for seller (with RBAC)
     * @param {number} requesterId - The user making the request
     * @param {number} requesterLevel - The user's permission level
     * @param {number} sellerId - The seller to get tasks for (null = self)
     * @param {string} date - The date (default: today)
     */
    async getTasks(requesterId, requesterLevel, sellerId = null, date = null) {
        const targetSellerId = sellerId || requesterId;
        const runDate = date || new Date().toISOString().split('T')[0];

        // RBAC check
        if (requesterLevel < 4 && targetSellerId !== requesterId) {
            throw new Error('FORBIDDEN: Cannot view other seller tasks');
        }

        // Check if we need to generate
        const { run } = await tasksRepository.getOrCreateRun(targetSellerId, runDate);

        if (!run || run.status !== 'DONE') {
            // Generate tasks first
            await this.generate(targetSellerId, runDate);
        }

        // Get tasks
        const tasks = await tasksRepository.getTasksForSellerDate(targetSellerId, runDate);

        return {
            seller_id: targetSellerId,
            run_date: runDate,
            tasks,
            summary: this._summarizeTasks(tasks)
        };
    }

    /**
     * Update task status with validation
     */
    async updateTaskStatus(taskId, status, actorId, actorLevel, extra = {}) {
        // Get task
        const task = await tasksRepository.getTaskById(taskId);
        if (!task) {
            throw new Error('TASK_NOT_FOUND');
        }

        // RBAC check
        if (actorLevel < 4 && task.seller_id !== actorId) {
            throw new Error('FORBIDDEN: Cannot update other seller tasks');
        }

        // Validate status transition
        const validTransitions = {
            'OPEN': ['IN_PROGRESS', 'SNOOZED', 'CANCELLED'],
            'IN_PROGRESS': ['DONE', 'SNOOZED', 'CANCELLED'],
            'SNOOZED': ['OPEN', 'IN_PROGRESS', 'CANCELLED'],
            'BACKLOG': ['OPEN', 'CANCELLED']
        };

        if (!validTransitions[task.status]?.includes(status)) {
            throw new Error(`INVALID_TRANSITION: Cannot go from ${task.status} to ${status}`);
        }

        // Validate outcome for DONE
        if (status === 'DONE') {
            if (!extra.outcomeCode) {
                throw new Error('OUTCOME_REQUIRED: outcome_code is required for DONE');
            }
            if (['LOST', 'ESCALATED'].includes(extra.outcomeCode) && !extra.outcomeReasonCode) {
                throw new Error('REASON_REQUIRED: outcome_reason_code is required for LOST/ESCALATED');
            }
        }

        // Update
        await tasksRepository.updateTaskStatus(
            taskId,
            status,
            actorLevel >= 4 ? 'MANAGER' : 'SELLER',
            actorId,
            extra
        );

        return await tasksRepository.getTaskById(taskId);
    }

    /**
     * Get task stats
     */
    async getStats(sellerId, startDate = null, endDate = null) {
        const stats = await tasksRepository.getTaskStats(sellerId, startDate, endDate);
        return this._aggregateStats(stats);
    }

    /**
     * Get SLA breaches
     */
    async getSlaBreaches(sellerId = null) {
        return await tasksRepository.getSlaBreaches(sellerId);
    }

    /**
     * Get outcome reasons
     */
    async getOutcomeReasons(outcomeCode = null) {
        return await tasksRepository.getOutcomeReasons(outcomeCode);
    }

    /**
     * Summarize tasks for response
     */
    _summarizeTasks(tasks) {
        const summary = {
            total: tasks.length,
            by_bucket: { CRITICAL: 0, OPPORTUNITY: 0, HYGIENE: 0 },
            by_status: { OPEN: 0, IN_PROGRESS: 0, DONE: 0, SNOOZED: 0 },
            completion_rate: 0,
            sla_breaches: 0
        };

        const now = new Date();

        for (const task of tasks) {
            summary.by_bucket[task.task_bucket]++;
            summary.by_status[task.status]++;

            if (task.sla_due_at && new Date(task.sla_due_at) < now &&
                ['OPEN', 'IN_PROGRESS'].includes(task.status)) {
                summary.sla_breaches++;
            }
        }

        const total = summary.by_status.OPEN + summary.by_status.IN_PROGRESS + summary.by_status.DONE;
        summary.completion_rate = total > 0
            ? Math.round((summary.by_status.DONE / total) * 100)
            : 0;

        return summary;
    }

    /**
     * Aggregate stats from raw rows
     */
    _aggregateStats(rows) {
        const result = {
            total: 0,
            done: 0,
            completion_rate: 0,
            by_bucket: {},
            by_outcome: {},
            by_reason: {}
        };

        for (const row of rows) {
            result.total += row.count;
            if (row.status === 'DONE') result.done += row.count;

            if (!result.by_bucket[row.task_bucket]) {
                result.by_bucket[row.task_bucket] = { total: 0, done: 0 };
            }
            result.by_bucket[row.task_bucket].total += row.count;
            if (row.status === 'DONE') result.by_bucket[row.task_bucket].done += row.count;

            if (row.outcome_code) {
                result.by_outcome[row.outcome_code] = (result.by_outcome[row.outcome_code] || 0) + row.count;
            }
            if (row.outcome_reason_code) {
                result.by_reason[row.outcome_reason_code] = (result.by_reason[row.outcome_reason_code] || 0) + row.count;
            }
        }

        result.completion_rate = result.total > 0
            ? Math.round((result.done / result.total) * 100)
            : 0;

        return result;
    }
}

export const taskEngine = new TaskEngine();
