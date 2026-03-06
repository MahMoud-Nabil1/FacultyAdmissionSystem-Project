const { Announcement, Settings } = require('../models/announcementSchema');

const getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.status(200).json(announcements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAnnouncementById = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
        res.status(200).json(announcement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createAnnouncement = async (req, res) => {
    try {
        const { title, content, author } = req.body;
        if (!title || !content) {
            return res.status(400).json({ message: 'Please provide title and content' });
        }

        const announcement = new Announcement({
            title,
            content,
            author: author || 'Admin'
        });

        const savedAnnouncement = await announcement.save();
        res.status(201).json(savedAnnouncement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateAnnouncement = async (req, res) => {
    try {
        const { title, content, author } = req.body;
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

        if (title) announcement.title = title;
        if (content) announcement.content = content;
        if (author) announcement.author = author;

        const updatedAnnouncement = await announcement.save();
        res.status(200).json(updatedAnnouncement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

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

const updateSettings = async (req, res) => {
    try {
        const { gpaMin, gpaMax, level, updatedBy } = req.body;

        if (gpaMin >= gpaMax) {
            return res.status(400).json({ message: 'الحد الأدنى يجب أن يكون أصغر من الحد الأقصى' });
        }

        if (gpaMin < 0 || gpaMin > 5 || gpaMax < 0 || gpaMax > 5) {
            return res.status(400).json({ message: 'القيم يجب أن تكون بين 0 و 5' });
        }

        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
        }

        if (gpaMin !== undefined) settings.gpaMin = gpaMin;
        if (gpaMax !== undefined) settings.gpaMax = gpaMax;
        if (level !== undefined) settings.level = level;
        if (updatedBy) settings.updatedBy = updatedBy;

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