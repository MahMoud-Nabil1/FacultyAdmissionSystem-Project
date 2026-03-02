const express = require('express');
const router = express.Router();
const subjectCtrl = require('../controllers/subject.controller');

router.post('/', subjectCtrl.createSubject);
router.get('/', subjectCtrl.getAllSubjects);
router.get('/:id', subjectCtrl.getSubjectById);
router.put('/:id', subjectCtrl.updateSubject);
router.delete('/:id', subjectCtrl.deleteSubject);

module.exports = router;
