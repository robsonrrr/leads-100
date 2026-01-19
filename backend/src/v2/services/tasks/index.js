/**
 * Daily Tasks Module
 * OODA Loop-driven task generation system
 * 
 * Components:
 * - TaskEngine: Main orchestrator
 * - SignalCollector: OBSERVE phase
 * - FeatureCalculator: NORMALIZE phase
 * - OrientationService: ORIENT phase
 * - RulesEngine: DECIDE phase
 */

export { TaskEngine, taskEngine } from './TaskEngine.js';
export { SignalCollector, signalCollector } from './SignalCollector.js';
export { FeatureCalculator, featureCalculator, FEATURE_KEYS } from './FeatureCalculator.js';
export { OrientationService, orientationService } from './OrientationService.js';
export { RulesEngine, rulesEngine } from './RulesEngine.js';
