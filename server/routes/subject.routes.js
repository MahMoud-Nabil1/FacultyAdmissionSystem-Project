const express = require('express');
const router = express.Router();
const subjectCtrl = require('../controllers/subject.controller');
const {authenticate} = require("../middleware/authMiddleware");
const {requireRole} = require("../controllers/auth.controller");

router.post('/', authenticate, requireRole(['admin']), subjectCtrl.createSubject);
router.get('/', authenticate, subjectCtrl.getAllSubjects);
router.get('/:id', authenticate, subjectCtrl.getSubjectById);
router.put('/:id', authenticate, requireRole(['admin']), subjectCtrl.updateSubject);
router.delete('/:id', authenticate, requireRole(['admin']), subjectCtrl.deleteSubject);

module.exports = router;
