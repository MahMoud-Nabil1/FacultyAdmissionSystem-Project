const express = require('express');
const router = express.Router();
const studentCtrl = require('../controllers/student.controller');
const {authenticate} = require("../middleware/authMiddleware");
const {requireRole} = require('../controllers/auth.controller');

router.post('/', authenticate, requireRole(['admin']), studentCtrl.createStudent);
router.get('/', authenticate, requireRole(['admin', 'academic_guide', 'academic_guide_coordinator', 'reporter']), studentCtrl.getAllStudents);
router.get('/:id', authenticate, requireRole(['admin', 'academic_guide', 'academic_guide_coordinator', 'reporter']), studentCtrl.getStudentById);
router.put('/:id', authenticate, requireRole(['admin']), studentCtrl.updateStudent)
router.delete('/:id', authenticate, requireRole(['admin']), studentCtrl.deleteStudent);
router.post('/contact-it', studentCtrl.contactIT);
router.post('/contact-admin', studentCtrl.contactAdmin);


module.exports = router;