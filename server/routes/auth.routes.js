const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth.controller');

// Separated login endpoints
router.post('/login/student', authCtrl.studentLogin);
router.post('/login/staff', authCtrl.staffLogin);

// Forgot password: request reset link by email (token stored in DB, email sent)
router.post('/forgot-password', authCtrl.requestPasswordReset);
// Step 1: verify token (e.g. when user opens link) — then show reset-password form
router.get('/verify-reset-token', authCtrl.verifyPasswordResetToken);
router.post('/verify-reset-token', authCtrl.verifyPasswordResetToken);
// Step 2: reset password with token + newPassword
router.post('/reset-password', authCtrl.resetPassword);

module.exports = router;