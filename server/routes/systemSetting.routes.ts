import { Router } from 'express';
import * as settingsCtrl from '../controllers/systemSetting.controller';
import { authenticate } from '../middleware/authMiddleware';
import { requireRole } from '../controllers/auth.controller';

const router = Router();

// Publicly available so frontend can adjust UI
router.get('/', settingsCtrl.getSettings);

// Only admins and coordinators can update
router.put('/', authenticate, requireRole(['admin', 'academic_guide_coordinator']), settingsCtrl.updateSettings);

export default router;
