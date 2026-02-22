
const router = express.Router();
const express = require('express');
const staffCtrl = require('../controllers/staff.controller');

router.post('/', staffCtrl.createStaff);
router.get('/', staffCtrl.getAllStaff);
router.get('/:id', staffCtrl.getStaffById);
router.put('/:id', staffCtrl.updateStaff);
router.delete('/:id', staffCtrl.deleteStaff);

export default router;