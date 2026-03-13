const express = require('express');
const router = express.Router();
const staffCtrl = require('../controllers/staff.controller');
const {authenticate} = require("../middleware/authMiddleware");
const {requireRole} = require('../controllers/auth.controller');

router.post('/', authenticate, requireRole(['admin']), staffCtrl.createStaff);
router.get('/', authenticate, requireRole(['admin', 'academic_guide', 'academic_guide_coordinator', 'reporter']), staffCtrl.getAllStaff);
router.get('/:id', authenticate, requireRole(['admin', 'academic_guide', 'academic_guide_coordinator', 'reporter']), staffCtrl.getStaffById);
router.put('/:id', authenticate, requireRole(['admin']), staffCtrl.updateStaff);
router.delete('/:id', authenticate, requireRole(['admin']), staffCtrl.deleteStaff);

module.exports = router;