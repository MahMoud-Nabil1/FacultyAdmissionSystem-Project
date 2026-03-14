import { Router } from 'express';
import * as staffCtrl from '../controllers/staff.controller';
import { authenticate } from "../middleware/authMiddleware";
import { requireRole } from '../controllers/auth.controller';

const router = Router();

router.post(
    '/',
    authenticate,
    requireRole(['admin']),
    staffCtrl.createStaff
);

router.get(
    '/',
    authenticate,
    requireRole(['admin', 'academic_guide', 'academic_guide_coordinator', 'reporter']),
    staffCtrl.getAllStaff
);

router.get(
    '/:id',
    authenticate,
    requireRole(['admin', 'academic_guide', 'academic_guide_coordinator', 'reporter']),
    staffCtrl.getStaffById
);

router.put(
    '/:id',
    authenticate,
    requireRole(['admin']),
    staffCtrl.updateStaff
);

router.delete(
    '/:id',
    authenticate,
    requireRole(['admin']),
    staffCtrl.deleteStaff
);

export default router;