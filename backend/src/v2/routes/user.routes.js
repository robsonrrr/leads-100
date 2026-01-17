import express from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/preferences', (req, res) => userController.getPreferences(req, res));
router.put('/preferences', (req, res) => userController.updatePreferences(req, res));

export default router;
