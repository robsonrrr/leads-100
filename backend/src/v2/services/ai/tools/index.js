import { customerTools } from './CustomerTools.js';
import { leadTools } from './LeadTools.js';
import { orderTools } from './OrderTools.js';
import { metricsTools } from './MetricsTools.js';
import { stockTools } from './StockTools.js';
import { interactionTools } from './InteractionTools.js';
import { pricingTools } from './PricingTools.js';
import { analyticsTools } from './AnalyticsTools.js';

// Agregar todas as ferramentas
const allTools = [
    customerTools,
    leadTools,
    orderTools,
    metricsTools,
    stockTools,
    interactionTools,
    pricingTools,
    analyticsTools
];

export const toolsRegistry = {
    // Lista unificada de definições para enviar ao LLM
    getDefinitions: () => {
        return allTools.flatMap(t => t.definitions);
    },

    // Mapa unificado de handlers para execução
    getHandler: (toolName) => {
        for (const toolGroup of allTools) {
            if (toolGroup.handlers[toolName]) {
                return toolGroup.handlers[toolName];
            }
        }
        return null;
    }
};
