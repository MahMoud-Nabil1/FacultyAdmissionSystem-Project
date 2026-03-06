const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth.controller');
const { authenticate } = require("../middleware/authMiddleware");

// Auth
router.post('/login', authCtrl.login);
router.get('/me', authenticate, authCtrl.getMe);


// Password resets
router.post('/forgot-password/faculty-email', authCtrl.requestPasswordResetFacultyEmail);
router.post('/forgot-password', authCtrl.requestPasswordReset);
router.get('/verify-reset-token', authCtrl.verifyPasswordResetToken);
router.post('/verify-reset-token', authCtrl.verifyPasswordResetToken);
router.post('/reset-password', authCtrl.resetPassword);
router.post("/change-password", authenticate, authCtrl.changePassword);


module.exports = router;