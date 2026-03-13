const express = require('express');
const router = express.Router();
const {
    getAnnouncements,
    getAnnouncementById,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getSettings,
    updateSettings
} = require('../controllers/announcement.controller');
const {authenticate} = require("../middleware/authMiddleware");
const {requireRole} = require("../controllers/auth.controller");

router.get('/', getAnnouncements);
router.get('/settings', getSettings);
router.get('/:id', getAnnouncementById);
router.post('/', authenticate, requireRole(['admin']), createAnnouncement);
router.put('/settings', authenticate, requireRole(['admin']), updateSettings);
router.put('/:id', authenticate, requireRole(['admin']), updateAnnouncement);
router.delete('/:id', authenticate, requireRole(['admin']), deleteAnnouncement);

module.exports = router;