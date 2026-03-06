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

router.get('/', getAnnouncements);
router.get('/settings', getSettings);
router.get('/:id', getAnnouncementById);
router.post('/', createAnnouncement);
router.put('/settings', updateSettings);
router.put('/:id', updateAnnouncement);
router.delete('/:id', deleteAnnouncement);

module.exports = router;