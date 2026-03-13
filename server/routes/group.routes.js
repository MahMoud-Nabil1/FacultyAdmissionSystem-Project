const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.Controller');
const {authenticate} = require("../middleware/authMiddleware");
const {requireRole} = require("../controllers/auth.controller");

// Basic CRUD routes
router.post('/', authenticate, requireRole(['admin']), groupController.createGroup);
router.get('/', authenticate, groupController.getAllGroups);
router.get('/:id', authenticate, groupController.getGroupById);
router.put('/:id', authenticate, requireRole(['admin']), groupController.updateGroup);
router.delete('/:id', authenticate, requireRole(['admin']), groupController.deleteGroup);

// Student management routes
router.post('/:id/students', authenticate, requireRole(['admin', 'academic_guide', 'academic_guide_coordinator']), groupController.addStudentToGroup);
router.delete('/:id/students', authenticate, requireRole(['admin', 'academic_guide_coordinator']), groupController.removeStudentFromGroup);

// Student adding/removing themselves
router.post('/:id/students/me', authenticate, groupController.addSelfToGroup);
router.delete('/:id/students/me', authenticate, groupController.removeSelfFromGroup);

// Filter routes
router.get('/day/:day', authenticate, groupController.getGroupsByDay);
router.get('/type/:type', authenticate, groupController.getGroupsByType);

module.exports = router;