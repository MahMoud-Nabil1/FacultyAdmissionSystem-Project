import { Router } from 'express';
import * as groupController from '../controllers/group.controller';
import { authenticate } from "../middleware/authMiddleware";
import { requireRole } from "../controllers/auth.controller";

const router = Router();

/**
 * Basic CRUD Routes
 */
router.post(
    '/',
    authenticate,
    requireRole(['admin']),
    groupController.createGroup
);

router.get(
    '/',
    authenticate,
    groupController.getAllGroups
);

router.get(
    '/:id',
    authenticate,
    groupController.getGroupById
);

router.put(
    '/:id',
    authenticate,
    requireRole(['admin']),
    groupController.updateGroup
);

router.delete(
    '/:id',
    authenticate,
    requireRole(['admin']),
    groupController.deleteGroup
);

/**
 * Student Management (Staff Actions)
 */
router.post(
    '/:id/students',
    authenticate,
    requireRole(['admin', 'academic_guide', 'academic_guide_coordinator']),
    groupController.addStudentToGroup
);

router.delete(
    '/:id/students',
    authenticate,
    requireRole(['admin', 'academic_guide_coordinator']),
    groupController.removeStudentFromGroup
);

/**
 * Enrollment (Self-Service)
 */
router.post(
    '/:id/students/me',
    authenticate,
    groupController.addSelfToGroup
);

router.delete(
    '/:id/students/me',
    authenticate,
    groupController.removeSelfFromGroup
);

/**
 * Filtering
 */
router.get(
    '/day/:day',
    authenticate,
    groupController.getGroupsByDay
);

router.get(
    '/type/:type',
    authenticate,
    groupController.getGroupsByType
);

export default router;