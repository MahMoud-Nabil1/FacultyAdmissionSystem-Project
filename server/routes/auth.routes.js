const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth.controller');


router.post('/login', authCtrl.login);
const { authenticate } = require("../middleware/authMiddleware");


router.get("/me", authenticate, authCtrl.getMe);


router.post('/forgot-password/faculty-email', authCtrl.requestPasswordResetFacultyEmail);
router.post('/forgot-password', authCtrl.requestPasswordReset);

router.get('/verify-reset-token', authCtrl.verifyPasswordResetToken);
router.post('/verify-reset-token', authCtrl.verifyPasswordResetToken);

router.post('/reset-password', authCtrl.resetPassword);

module.exports = router;