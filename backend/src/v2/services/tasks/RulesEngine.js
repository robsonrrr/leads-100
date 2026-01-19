/**
 * Rules Engine
 * DECIDE phase of OODA Loop
 * 
 * Evaluates features and orientation against configured rules
 * to generate task candidates with priority scores and "why" explanations.
 */
import { getDatabase } from '../../../config/database.js';
import logger from '../../../config/logger.js';
import { tasksRepository } from '../../repositories/tasks.repository.js';
import { FEATURE_KEYS } from './FeatureCalculator.js';

const db = () => getDatabase();

/**
 * Safely parse JSON - handles strings, objects, and invalid JSON
 */
const safeParseJson = (val, defaultVal = {}) => {
    if (!val) return defaultVal;
    if (typeof val === 'object') return val;
    try {
        return JSON.parse(val);
    } catch (e) {
        logger.debug('safeParseJson: Invalid JSON', { val: String(val).substring(0, 50) });
        return defaultVal;
    }
};

export class RulesEngine {
    /**
     * Generate task candidates from features and orientation
     * @param {number} runId - The run ID
     * @param {number} sellerId - The seller ID
     * @returns {Array} Array of task candidates
     */
    async generateCandidates(runId, sellerId) {
        logger.info('RulesEngine: Generating candidates', { runId, sellerId });

        const candidates = [];

        try {
            // Get all active rules
            const rules = await tasksRepository.getActiveRules();
            logger.debug('RulesEngine: Loaded rules', { count: rules.length });

            // Get all features grouped by entity
            const [featureRows] = await db().execute(`
                SELECT 
                    f.*,
                    s.signal_ts,
                    s.payload_json as signal_payload
                FROM staging.sales_signal_feature f
                LEFT JOIN staging.sales_raw_signal s 
                    ON s.run_id = f.run_id 
                    AND s.customer_id = f.customer_id 
                    AND s.entity_type = f.entity_type 
                    AND s.entity_id = f.entity_id
                WHERE f.run_id = ?
                ORDER BY f.customer_id, f.entity_type, f.entity_id
            `, [runId]);

            // Group features by entity
            const entities = this._groupByEntity(featureRows);

            // Get orientations for all customers
            const [snapshots] = await db().execute(`
                SELECT * FROM staging.sales_orientation_snapshot WHERE run_id = ?
            `, [runId]);

            const orientationMap = {};
            for (const snap of snapshots) {
                orientationMap[snap.customer_id] = {
                    ...snap,
                    orientation_json: safeParseJson(snap.orientation_json)
                };
            }

            // Evaluate each entity against each rule
            for (const [entityKey, entity] of Object.entries(entities)) {
                const orientation = orientationMap[entity.customer_id] || null;

                for (const rule of rules) {
                    const result = this._evaluateRule(rule, entity, orientation);

                    if (result.matches) {
                        candidates.push({
                            ...result,
                            runId,
                            sellerId,
                            customerId: entity.customer_id,
                            customerName: entity.customer_name,
                            entityType: entity.entity_type,
                            entityId: entity.entity_id,
                            signalTs: entity.signal_ts,
                            rule
                        });
                    }
                }
            }

            logger.info('RulesEngine: Candidates generated', {
                runId,
                total: candidates.length,
                byBucket: this._countByBucket(candidates)
            });

            return candidates;

        } catch (error) {
            logger.error('RulesEngine: Error', error);
            throw error;
        }
    }

    /**
     * Group feature rows by entity
     */
    _groupByEntity(rows) {
        const entities = {};

        for (const row of rows) {
            const key = `${row.customer_id}_${row.entity_type}_${row.entity_id}`;

            if (!entities[key]) {
                const payload = row.signal_payload
                    ? safeParseJson(row.signal_payload)
                    : {};

                entities[key] = {
                    customer_id: row.customer_id,
                    customer_name: payload.customer_name || null,
                    entity_type: row.entity_type,
                    entity_id: row.entity_id,
                    signal_ts: row.signal_ts,
                    features: {}
                };
            }

            entities[key].features[row.feature_key] = parseFloat(row.feature_value) || 0;
        }

        return entities;
    }

    /**
     * Evaluate a single rule against an entity
     */
    _evaluateRule(rule, entity, orientation) {
        const features = entity.features || {};

        const conditions = safeParseJson(rule.conditions_json);
        const scoring = safeParseJson(rule.scoring_json);
        const playbook = safeParseJson(rule.playbook_json);
        const guardrails = safeParseJson(rule.guardrail_json);

        // Check conditions
        const conditionResult = this._checkConditions(conditions, features, orientation);

        if (!conditionResult.matches) {
            return { matches: false };
        }

        // Calculate score
        const scoreResult = this._calculateScore(rule.priority_base, scoring, features, orientation);

        // Build "why" explanation
        const why = [
            ...conditionResult.why,
            ...scoreResult.why
        ];

        // Build recommended_json with "why"
        const recommendedJson = {
            why,
            rule_id: rule.rule_id,
            signals: Object.keys(features).map(k => k.split('_')[0]),
            features: Object.fromEntries(
                Object.entries(features).filter(([k, v]) => v > 0)
            ),
            playbook
        };

        return {
            matches: true,
            score: scoreResult.score,
            why,
            recommendedJson,
            guardrailJson: guardrails
        };
    }

    /**
     * Check if conditions match
     */
    _checkConditions(conditions, features, orientation) {
        const why = [];

        // Check requires_any_feature
        if (conditions.requires_any_feature && conditions.requires_any_feature.length > 0) {
            const hasAny = conditions.requires_any_feature.some(key =>
                features[key] !== undefined && features[key] !== null
            );
            if (!hasAny) {
                return { matches: false };
            }
        }

        // Check feature_min
        if (conditions.feature_min) {
            for (const [key, minVal] of Object.entries(conditions.feature_min)) {
                const val = features[key];
                if (val === undefined || val < minVal) {
                    return { matches: false };
                }
                why.push(`${key}>=${minVal}`);
            }
        }

        // Check feature_max
        if (conditions.feature_max) {
            for (const [key, maxVal] of Object.entries(conditions.feature_max)) {
                const val = features[key];
                if (val !== undefined && val > maxVal) {
                    return { matches: false };
                }
            }
        }

        // Check requires_orient
        if (conditions.requires_orient && orientation) {
            for (const req of conditions.requires_orient) {
                const val = this._getJsonPath(orientation.orientation_json, req.path);

                if (req.in && !req.in.includes(val)) {
                    return { matches: false };
                }
                if (req.equals && val !== req.equals) {
                    return { matches: false };
                }
                if (req.min !== undefined && (val === null || val < req.min)) {
                    return { matches: false };
                }
                if (req.max !== undefined && (val === null || val > req.max)) {
                    return { matches: false };
                }
            }
        }

        return { matches: true, why };
    }

    /**
     * Calculate priority score
     */
    _calculateScore(baseScore, scoring, features, orientation) {
        let score = baseScore;
        const why = [];

        // Add points from feature conditions
        if (scoring.add_if_feature) {
            for (const rule of scoring.add_if_feature) {
                const val = features[rule.key];

                if (val !== undefined) {
                    if (rule.min !== undefined && val >= rule.min) {
                        score += rule.points;
                        why.push(`${rule.key}>=${rule.min} (+${rule.points})`);
                    }
                    if (rule.max !== undefined && val <= rule.max) {
                        score += rule.points;
                        why.push(`${rule.key}<=${rule.max} (+${rule.points})`);
                    }
                }
            }
        }

        // Add points from orientation conditions
        if (scoring.add_if_orient && orientation) {
            for (const rule of scoring.add_if_orient) {
                const val = this._getJsonPath(orientation.orientation_json, rule.path);

                if (rule.equals !== undefined && val === rule.equals) {
                    score += rule.points;
                    why.push(`${rule.path}=${rule.equals} (+${rule.points})`);
                }
                if (rule.in && rule.in.includes(val)) {
                    score += rule.points;
                    why.push(`${rule.path} in [${rule.in.join(',')}] (+${rule.points})`);
                }
                if (rule.min !== undefined && val !== null && val >= rule.min) {
                    score += rule.points;
                    why.push(`${rule.path}>=${rule.min} (+${rule.points})`);
                }
                if (rule.max !== undefined && val !== null && val <= rule.max) {
                    score += rule.points;
                    why.push(`${rule.path}<=${rule.max} (+${rule.points})`);
                }
            }
        }

        // Clamp score to 0-100
        score = Math.max(0, Math.min(100, score));

        return { score, why };
    }

    /**
     * Get value from JSON path (simple implementation)
     * Supports: $.field, $.nested.field
     */
    _getJsonPath(obj, path) {
        if (!obj || !path) return null;

        // Remove $. prefix
        const cleanPath = path.replace(/^\$\./, '');
        const parts = cleanPath.split('.');

        let current = obj;
        for (const part of parts) {
            if (current === null || current === undefined) return null;
            current = current[part];
        }

        return current;
    }

    /**
     * Count candidates by bucket
     */
    _countByBucket(candidates) {
        const counts = { CRITICAL: 0, OPPORTUNITY: 0, HYGIENE: 0 };
        for (const c of candidates) {
            counts[c.rule.task_bucket]++;
        }
        return counts;
    }

    /**
     * Build task from candidate
     */
    buildTask(candidate, runDate) {
        const rule = candidate.rule;

        // Render title template
        let title = rule.title_template || 'Task';
        title = title.replace('{customer_name}', candidate.customerName || 'Cliente');
        title = title.replace('{entity_id}', candidate.entityId || '');
        title = title.replace('{goal_progress}', candidate.recommendedJson.features?.GOAL_PROGRESS_PCT?.toFixed(0) || '0');
        title = title.replace('{days_inactive}', candidate.recommendedJson.features?.DAYS_INACTIVE?.toFixed(0) || '0');

        // Calculate SLA from event (signal_ts), not now
        const slaSourceTs = candidate.signalTs ? new Date(candidate.signalTs) : new Date();
        const slaDueAt = new Date(slaSourceTs.getTime() + (rule.sla_hours * 60 * 60 * 1000));

        return {
            runDate,
            sellerId: candidate.sellerId,
            customerId: candidate.customerId,
            entityType: candidate.entityType,
            entityId: candidate.entityId,
            taskBucket: rule.task_bucket,
            taskType: rule.task_type,
            title,
            description: rule.description_template || null,
            priorityScore: candidate.score,
            slaDueAt: slaDueAt.toISOString().slice(0, 19).replace('T', ' '),
            slaSourceTs: slaSourceTs.toISOString().slice(0, 19).replace('T', ' '),
            customerName: candidate.customerName,
            recommendedJson: candidate.recommendedJson,
            guardrailJson: candidate.guardrailJson,
            orientationRef: null, // Will be set later
            ruleId: rule.rule_id,
            status: 'OPEN'
        };
    }
}

export const rulesEngine = new RulesEngine();
