import { Router } from 'express';
import * as adminCtrl from '../controllers/announcement.controller';
import { authenticate } from "../middleware/authMiddleware";
import { requireRole } from "../controllers/auth.controller";

const router = Router();

router.get('/', adminCtrl.getAnnouncements);
router.get('/settings', adminCtrl.getSettings);
router.get('/:id', adminCtrl.getAnnouncementById);

// Create a new announcement
router.post(
    '/',
    authenticate,
    requireRole(['admin']),
    adminCtrl.createAnnouncement
);

// Update global system settings (GPA, levels, etc.)
router.put(
    '/settings',
    authenticate,
    requireRole(['admin', 'academic_guide_coordinator']),
    adminCtrl.updateSettings
);

// Update an existing announcement
router.put(
    '/:id',
    authenticate,
    requireRole(['admin']),
    adminCtrl.updateAnnouncement
);

// Delete an announcement
router.delete(
    '/:id',
    authenticate,
    requireRole(['admin']),
    adminCtrl.deleteAnnouncement
);

export default router;