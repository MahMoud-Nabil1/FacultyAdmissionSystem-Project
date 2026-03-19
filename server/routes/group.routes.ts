import { Router } from 'express';
import * as groupController from '../controllers/group.controller';
import * as enrollmentController from '../controllers/enrollment.controller';
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

// Student views their own requests (MUST be before /:id to avoid matching 'my-requests' as an :id)
router.get(
    '/my-requests',
    authenticate,
    groupController.getMyRequests
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

/**
 * Enrollment Requests (Student Self-Service)
 */
// Student requests to join a group
router.post(
    '/:id/request',
    authenticate,
    enrollmentController.requestJoinGroup
);

// Student leaves a group
router.delete(
    '/:id/students/me',
    authenticate,
    groupController.removeSelfFromGroup
);

// Student cancels their pending request
router.delete(
    '/requests/:requestId',
    authenticate,
    groupController.cancelMyRequest
);

/**
 * Enrollment Request Management (Staff)
 */
// Staff views pending requests for a group
router.get(
    '/:id/requests',
    authenticate,
    requireRole(['admin', 'academic_guide_coordinator']),
    groupController.getPendingRequestsForGroup
);

// Staff approves/rejects a request
router.post(
    '/requests/:requestId/process',
    authenticate,
    requireRole(['admin', 'academic_guide_coordinator']),
    enrollmentController.processEnrollmentRequest
);

export default router;