import express from 'express';
import { chatbotController } from '../controllers/chatbot.controller.js';
import { aiController } from '../controllers/ai.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

// Todas as rotas de IA requerem autenticação
router.use(authenticateToken);

// Middleware de permissão para Chatbot IA (Apenas Level > 4 ou Usuário 107)
const canUseChatbot = (req, res, next) => {
    const { level, userId } = req.user;
    if (level > 4 || userId === 107) {
        return next();
    }
    return res.status(403).json({
        success: false,
        error: { message: 'Acesso ao Chatbot IA restrito.' }
    });
};

// Chatbot
router.post('/chat', canUseChatbot, (req, res) => chatbotController.sendMessage(req, res));
router.get('/conversations', canUseChatbot, (req, res) => chatbotController.getConversations(req, res));
router.get('/conversations/:id', canUseChatbot, (req, res) => chatbotController.getMessages(req, res));

// Forecast
router.get('/forecast', (req, res) => aiController.getForecast(req, res));
router.get('/forecast/validate', (req, res) => aiController.validateForecast(req, res));
router.get('/forecast/report', (req, res) => aiController.getMonthlyForecastReport(req, res));

// Churn Risk
router.get('/churn-risk', (req, res) => aiController.getChurnRisk(req, res));

// Deviation Analysis
router.get('/deviation', (req, res) => aiController.getDeviation(req, res));

// Recommendations
router.get('/recommendations', (req, res) => aiController.getRecommendations(req, res));
router.get('/recommendations/discount', (req, res) => aiController.getDiscountRecommendation(req, res));

export default router;
