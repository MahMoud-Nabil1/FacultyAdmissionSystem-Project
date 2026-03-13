const { Announcement, Settings } = require('../models/announcementSchema');

// Get all announcements
const getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.status(200).json(announcements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get announcement by ID
const getAnnouncementById = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
        res.status(200).json(announcement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new announcement using JWT info
const createAnnouncement = async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Please provide title and content' });
        }

        if (!req.user || !req.user.name || !req.user.role) {
            return res.status(401).json({ message: 'Unauthorized: missing user info' });
        }

        const announcement = new Announcement({
            title,
            content,
            author: `${req.user.name}`
        });

        const savedAnnouncement = await announcement.save();
        res.status(201).json(savedAnnouncement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update announcement using JWT info
const updateAnnouncement = async (req, res) => {
    try {
        const { title, content } = req.body;

        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

        if (title) announcement.title = title;
        if (content) announcement.content = content;

        if (req.user && req.user.name && req.user.role) {
            announcement.author = `${req.user.name}`;
        }

        const updatedAnnouncement = await announcement.save();
        res.status(200).json(updatedAnnouncement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete announcement
const deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

        await announcement.deleteOne();
        res.status(200).json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
            await settings.save();
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update settings with JWT info
const updateSettings = async (req, res) => {
    try {
        const { gpaMin, gpaMax, level } = req.body;

        if (gpaMin !== undefined && gpaMax !== undefined && gpaMin >= gpaMax) {
            return res.status(400).json({ message: 'الحد الأدنى يجب أن يكون أصغر من الحد الأقصى' });
        }

        if ((gpaMin !== undefined && (gpaMin < 0 || gpaMin > 5)) ||
            (gpaMax !== undefined && (gpaMax < 0 || gpaMax > 5))) {
            return res.status(400).json({ message: 'القيم يجب أن تكون بين 0 و 5' });
        }

        let settings = await Settings.findOne();
        if (!settings) settings = new Settings();

        if (gpaMin !== undefined) settings.gpaMin = gpaMin;
        if (gpaMax !== undefined) settings.gpaMax = gpaMax;
        if (level !== undefined) settings.level = level;

        if (req.user && req.user.name && req.user.role) {
            settings.updatedBy = `${req.user.name}`;
        }

        const updatedSettings = await settings.save();
        res.status(200).json(updatedSettings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getAnnouncements,
    getAnnouncementById,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getSettings,
    updateSettings
};