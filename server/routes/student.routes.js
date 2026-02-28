const express = require('express');
const router = express.Router();
const studentCtrl = require('../controllers/student.controller');

router.post('/', studentCtrl.createStudent);
router.get('/', studentCtrl.getAllStudents);
router.get('/:id', studentCtrl.getStudentById);
router.put('/:id', studentCtrl.updateStudent)
router.delete('/:id', studentCtrl.deleteStudent);
router.post('/contact-it', studentCtrl.contactIT);
router.post('/contact-admin', studentCtrl.contactAdmin);



module.exports = router;