import { Router } from 'express';
import * as authCtrl from '../controllers/auth.controller';
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

/**
 * Auth Routes
 */
router.post('/login', authCtrl.login);
router.get('/me', authenticate, authCtrl.getMe);

/**
 * Password Reset Routes
 */
router.post('/forgot-password/faculty-email', authCtrl.requestPasswordResetFacultyEmail);
router.post('/forgot-password', authCtrl.requestPasswordReset);

router.get('/verify-reset-token', authCtrl.verifyPasswordResetToken);

router.post('/reset-password', authCtrl.resetPassword);

/**
 * Account Security
 */
router.post("/change-password", authenticate, authCtrl.changePassword);

export default router;