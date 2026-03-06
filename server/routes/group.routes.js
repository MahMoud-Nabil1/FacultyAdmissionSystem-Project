const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.Controller');

// Basic CRUD routes
router.post('/', groupController.createGroup);
router.get('/', groupController.getAllGroups);
router.get('/:id', groupController.getGroupById);
router.put('/:id', groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);

// Student management routes
router.post('/:id/students', groupController.addStudentToGroup);
router.delete('/:id/students', groupController.removeStudentFromGroup);

// Filter routes
router.get('/day/:day', groupController.getGroupsByDay);
router.get('/type/:type', groupController.getGroupsByType);

module.exports = router;
