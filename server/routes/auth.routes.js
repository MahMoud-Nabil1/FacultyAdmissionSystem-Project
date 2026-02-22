const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth.controller');

//shared login between staff and students
router.post('/login', authCtrl.login);

module.exports = router;