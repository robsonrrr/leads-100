/**
 * Tasks Repository
 * CRUD operations for Daily Tasks system
 * 
 * Tables: sales_task_run, sales_raw_signal, sales_signal_feature, 
 *         sales_orientation_snapshot, sales_task, sales_task_action_log
 */
import { getDatabase } from '../../config/database.js';
import logger from '../../config/logger.js';
import crypto from 'crypto';

const db = () => getDatabase();

/**
 * Safely parse JSON - handles strings, objects, and invalid JSON
 */
const safeParseJson = (val, defaultVal = null) => {
    if (!val) return defaultVal;
    if (typeof val === 'object') return val;
    try {
        return JSON.parse(val);
    } catch (e) {
        logger.debug('safeParseJson: Invalid JSON', { val: String(val).substring(0, 50) });
        return defaultVal;
    }
};

export class TasksRepository {
    // ==========================================================
    // TASK RUN
    // ==========================================================

    /**
     * Create or get existing run for seller/date
     * Idempotent by (seller_id, run_date)
     */
    async getOrCreateRun(sellerId, runDate = null) {
        const date = runDate || new Date().toISOString().split('T')[0];

        try {
            // Try to get existing run
            const [existing] = await db().execute(
                `SELECT * FROM staging.sales_task_run 
                 WHERE seller_id = ? AND run_date = ?`,
                [sellerId, date]
            );

            if (existing.length > 0) {
                return { run: existing[0], isNew: false };
            }

            // Create new run
            const [result] = await db().execute(
                `INSERT INTO staging.sales_task_run (seller_id, run_date, status)
                 VALUES (?, ?, 'RUNNING')`,
                [sellerId, date]
            );

            const [newRun] = await db().execute(
                `SELECT * FROM staging.sales_task_run WHERE run_id = ?`,
                [result.insertId]
            );

            return { run: newRun[0], isNew: true };
        } catch (error) {
            // Handle race condition (unique constraint)
            if (error.code === 'ER_DUP_ENTRY') {
                const [existing] = await db().execute(
                    `SELECT * FROM staging.sales_task_run 
                     WHERE seller_id = ? AND run_date = ?`,
                    [sellerId, date]
                );
                return { run: existing[0], isNew: false };
            }
            throw error;
        }
    }

    /**
     * Update run status
     */
    async updateRunStatus(runId, status, statsJson = null, errorMsg = null) {
        await db().execute(
            `UPDATE staging.sales_task_run 
             SET status = ?, 
                 finished_at = IF(? IN ('DONE','FAILED'), NOW(6), finished_at),
                 stats_json = COALESCE(?, stats_json),
                 error_msg = ?
             WHERE run_id = ?`,
            [status, status, statsJson ? JSON.stringify(statsJson) : null, errorMsg, runId]
        );
    }

    // ==========================================================
    // RAW SIGNALS (OBSERVE)
    // ==========================================================

    /**
     * Insert raw signal with dedup
     */
    async insertSignal(runId, signal) {
        const {
            sellerId, customerId, source, signalType, signalTs,
            entityType, entityId, payloadJson
        } = signal;

        // Generate dedup hash
        const dedupData = `${source}|${signalType}|${entityType || ''}|${entityId || ''}|${customerId || ''}`;
        const dedupHash = crypto.createHash('md5').update(dedupData).digest('hex');

        try {
            await db().execute(
                `INSERT INTO staging.sales_raw_signal 
                 (run_id, seller_id, customer_id, source, signal_type, signal_ts, 
                  entity_type, entity_id, payload_json, dedup_hash)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    runId, sellerId, customerId, source, signalType,
                    signalTs, entityType, entityId,
                    JSON.stringify(payloadJson), dedupHash
                ]
            );
            return true;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                // Dedup - already exists
                return false;
            }
            throw error;
        }
    }

    /**
     * Bulk insert signals
     */
    async insertSignals(runId, signals) {
        let inserted = 0;
        for (const signal of signals) {
            if (await this.insertSignal(runId, signal)) {
                inserted++;
            }
        }
        return inserted;
    }

    // ==========================================================
    // FEATURES (NORMALIZE)
    // ==========================================================

    /**
     * Insert/update feature
     */
    async upsertFeature(runId, feature) {
        const {
            sellerId, customerId, entityType, entityId,
            featureKey, featureValue, featureStr, featureJson
        } = feature;

        await db().execute(
            `INSERT INTO staging.sales_signal_feature 
             (run_id, seller_id, customer_id, entity_type, entity_id,
              feature_key, feature_value, feature_str, feature_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
              feature_value = VALUES(feature_value),
              feature_str = VALUES(feature_str),
              feature_json = VALUES(feature_json),
              computed_at = NOW(6)`,
            [
                runId, sellerId, customerId, entityType, entityId,
                featureKey, featureValue, featureStr,
                featureJson ? JSON.stringify(featureJson) : null
            ]
        );
    }

    /**
     * Get features for a run
     */
    async getFeatures(runId, customerId = null, entityType = null, entityId = null) {
        let query = `SELECT * FROM staging.sales_signal_feature WHERE run_id = ?`;
        const params = [runId];

        if (customerId) {
            query += ` AND customer_id = ?`;
            params.push(customerId);
        }
        if (entityType) {
            query += ` AND entity_type = ?`;
            params.push(entityType);
        }
        if (entityId) {
            query += ` AND entity_id = ?`;
            params.push(entityId);
        }

        const [rows] = await db().execute(query, params);
        return rows;
    }

    // ==========================================================
    // ORIENTATION SNAPSHOTS (ORIENT)
    // ==========================================================

    /**
     * Create orientation snapshot
     */
    async createSnapshot(runId, snapshot) {
        const {
            sellerId, customerId, orientationJson, orientationVer,
            orientationSourcesJson, clientMode, urgency, priceSensitivity,
            churnRisk, goalProgress, daysInactive, lastOrderValue
        } = snapshot;

        const [result] = await db().execute(
            `INSERT INTO staging.sales_orientation_snapshot 
             (run_id, seller_id, customer_id, orientation_json, orientation_ver,
              orientation_sources_json, computed_at, client_mode, urgency, 
              price_sensitivity, churn_risk, goal_progress, days_inactive, last_order_value)
             VALUES (?, ?, ?, ?, ?, ?, NOW(6), ?, ?, ?, ?, ?, ?, ?)`,
            [
                runId, sellerId, customerId,
                JSON.stringify(orientationJson), orientationVer || 1,
                orientationSourcesJson ? JSON.stringify(orientationSourcesJson) : null,
                clientMode, urgency, priceSensitivity,
                churnRisk, goalProgress, daysInactive, lastOrderValue
            ]
        );

        return result.insertId;
    }

    /**
     * Get snapshot for customer in run
     */
    async getSnapshot(runId, customerId) {
        const [rows] = await db().execute(
            `SELECT * FROM staging.sales_orientation_snapshot 
             WHERE run_id = ? AND customer_id = ?`,
            [runId, customerId]
        );
        return rows[0] || null;
    }

    // ==========================================================
    // TASK RULES
    // ==========================================================

    /**
     * Get active rules
     */
    async getActiveRules(bucket = null) {
        let query = `SELECT * FROM staging.sales_task_rule WHERE is_enabled = 1`;
        const params = [];

        if (bucket) {
            query += ` AND task_bucket = ?`;
            params.push(bucket);
        }

        query += ` ORDER BY priority_base DESC`;

        const [rows] = await db().execute(query, params);
        return rows.map(r => ({
            ...r,
            conditions_json: safeParseJson(r.conditions_json, {}),
            scoring_json: safeParseJson(r.scoring_json, {}),
            playbook_json: safeParseJson(r.playbook_json),
            guardrail_json: safeParseJson(r.guardrail_json)
        }));
    }

    // ==========================================================
    // TASKS
    // ==========================================================

    /**
     * Create task with dedup
     */
    async createTask(runId, task) {
        const {
            runDate, sellerId, customerId, entityType, entityId,
            taskBucket, taskType, title, description, priorityScore,
            slaDueAt, slaSourceTs, customerName, recommendedJson,
            guardrailJson, contextJson, orientationRef, ruleId, status
        } = task;

        // Generate dedup key
        const dedupKey = `${sellerId}|${runDate}|${taskType}|${entityType || '-'}|${entityId || '-'}|${customerId || '-'}`;

        try {
            const [result] = await db().execute(
                `INSERT INTO staging.sales_task 
                 (run_id, run_date, seller_id, customer_id, entity_type, entity_id,
                  dedup_key, task_bucket, task_type, title, description,
                  priority_score, sla_due_at, sla_source_ts, customer_name,
                  recommended_json, guardrail_json, context_json,
                  orientation_ref, rule_id, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    runId, runDate, sellerId, customerId, entityType, entityId,
                    dedupKey, taskBucket, taskType, title, description,
                    priorityScore, slaDueAt, slaSourceTs, customerName,
                    recommendedJson ? JSON.stringify(recommendedJson) : null,
                    guardrailJson ? JSON.stringify(guardrailJson) : null,
                    contextJson ? JSON.stringify(contextJson) : null,
                    orientationRef, ruleId, status || 'OPEN'
                ]
            );

            // Log creation
            await this.logAction(result.insertId, 'CREATED', 'SYSTEM', null, null, { rule_id: ruleId });

            return { taskId: result.insertId, isNew: true };
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                // Already exists - get existing
                const [existing] = await db().execute(
                    `SELECT task_id FROM staging.sales_task WHERE dedup_key = ?`,
                    [dedupKey]
                );
                return { taskId: existing[0]?.task_id, isNew: false };
            }
            throw error;
        }
    }

    /**
     * Get tasks for seller/date
     */
    async getTasksForSellerDate(sellerId, runDate, excludeBacklog = true) {
        let query = `
            SELECT t.*, r.playbook_json as rule_playbook
            FROM staging.sales_task t
            LEFT JOIN staging.sales_task_rule r ON r.rule_id = t.rule_id
            WHERE t.seller_id = ? AND t.run_date = ?
        `;
        const params = [sellerId, runDate];

        if (excludeBacklog) {
            query += ` AND t.status != 'BACKLOG'`;
        }

        query += ` ORDER BY 
            FIELD(t.task_bucket, 'CRITICAL', 'OPPORTUNITY', 'HYGIENE'),
            t.priority_score DESC`;

        const [rows] = await db().execute(query, params);
        return rows.map(this._parseTaskRow);
    }

    /**
     * Get task by ID
     */
    async getTaskById(taskId) {
        const [rows] = await db().execute(
            `SELECT t.*, r.playbook_json as rule_playbook, r.guardrail_json as rule_guardrail
             FROM staging.sales_task t
             LEFT JOIN staging.sales_task_rule r ON r.rule_id = t.rule_id
             WHERE t.task_id = ?`,
            [taskId]
        );
        return rows[0] ? this._parseTaskRow(rows[0]) : null;
    }

    /**
     * Update task status
     */
    async updateTaskStatus(taskId, status, actorType, actorId, extra = {}) {
        const updates = ['status = ?'];
        const params = [status];

        if (status === 'IN_PROGRESS') {
            updates.push('started_at = COALESCE(started_at, NOW(6))');
        }
        if (status === 'DONE') {
            updates.push('done_at = NOW(6)');
            if (extra.outcomeCode) {
                updates.push('outcome_code = ?');
                params.push(extra.outcomeCode);
            }
            if (extra.outcomeReasonCode) {
                updates.push('outcome_reason_code = ?');
                params.push(extra.outcomeReasonCode);
            }
            if (extra.outcomeNote) {
                updates.push('outcome_note = ?');
                params.push(extra.outcomeNote);
            }
            if (extra.outcomeJson) {
                updates.push('outcome_json = ?');
                params.push(JSON.stringify(extra.outcomeJson));
            }
        }
        if (status === 'SNOOZED' && extra.snoozedUntil) {
            updates.push('snoozed_until = ?');
            params.push(extra.snoozedUntil);
        }

        params.push(taskId);

        await db().execute(
            `UPDATE staging.sales_task SET ${updates.join(', ')} WHERE task_id = ?`,
            params
        );

        // Log action
        const actionType = status === 'IN_PROGRESS' ? 'STARTED' : status;
        await this.logAction(taskId, actionType, actorType, actorId, extra.note, extra);
    }

    /**
     * Parse task row from DB
     */
    _parseTaskRow(row) {
        return {
            ...row,
            recommended_json: safeParseJson(row.recommended_json),
            guardrail_json: safeParseJson(row.guardrail_json),
            context_json: safeParseJson(row.context_json),
            outcome_json: safeParseJson(row.outcome_json),
            rule_playbook: safeParseJson(row.rule_playbook),
            rule_guardrail: safeParseJson(row.rule_guardrail)
        };
    }

    // ==========================================================
    // ACTION LOG (TELEMETRY)
    // ==========================================================

    /**
     * Log an action
     */
    async logAction(taskId, actionType, actorType = 'SYSTEM', actorId = null, note = null, payloadJson = null) {
        await db().execute(
            `INSERT INTO staging.sales_task_action_log 
             (task_id, action_type, actor_type, actor_id, note, payload_json)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [taskId, actionType, actorType, actorId, note, payloadJson ? JSON.stringify(payloadJson) : null]
        );
    }

    // ==========================================================
    // OUTCOME REASONS
    // ==========================================================

    /**
     * Get active outcome reasons
     */
    async getOutcomeReasons(outcomeCode = null) {
        let query = `SELECT * FROM staging.sales_outcome_reason WHERE is_active = 1`;
        const params = [];

        if (outcomeCode) {
            query += ` AND FIND_IN_SET(?, applies_to) > 0`;
            params.push(outcomeCode);
        }

        query += ` ORDER BY sort_order`;

        const [rows] = await db().execute(query, params);
        return rows;
    }

    // ==========================================================
    // STATS & ANALYTICS
    // ==========================================================

    /**
     * Get task stats for seller
     */
    async getTaskStats(sellerId, startDate = null, endDate = null) {
        const start = startDate || new Date().toISOString().split('T')[0];
        const end = endDate || start;

        const [rows] = await db().execute(`
            SELECT 
                task_bucket,
                status,
                outcome_code,
                outcome_reason_code,
                COUNT(*) as count
            FROM staging.sales_task
            WHERE seller_id = ?
              AND run_date BETWEEN ? AND ?
            GROUP BY task_bucket, status, outcome_code, outcome_reason_code
        `, [sellerId, start, end]);

        return rows;
    }

    /**
     * Get SLA breaches
     */
    async getSlaBreaches(sellerId = null) {
        let query = `SELECT * FROM staging.vw_sales_task_sla_breaches`;
        const params = [];

        if (sellerId) {
            query += ` WHERE seller_id = ?`;
            params.push(sellerId);
        }

        const [rows] = await db().execute(query, params);
        return rows;
    }
}

export const tasksRepository = new TasksRepository();
