const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth.controller');

//shared login between staff and students
router.post('/login', authCtrl.login);

// Separated login endpoints
router.post('/login/student', authCtrl.studentLogin);
router.post('/login/staff', authCtrl.staffLogin);

module.exports = router;