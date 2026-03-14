import { Request, Response } from 'express';
import { Announcement, Settings } from '../models/announcement';
import { UserPayload } from '../middleware/authMiddleware';

export const getAnnouncements = async (_req: Request, res: Response): Promise<void> => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.status(200).json(announcements);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getAnnouncementById = async (req: Request, res: Response): Promise<void> => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            res.status(404).json({ message: 'Announcement not found' });
            return;
        }
        res.status(200).json(announcement);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createAnnouncement = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, content } = req.body;
        const user = req.user as UserPayload;

        if (!title || !content) {
            res.status(400).json({ message: 'Please provide title and content' });
            return;
        }

        if (!user || !user.name) {
            res.status(401).json({ message: 'Unauthorized: missing user info' });
            return;
        }

        const announcement = new Announcement({
            title,
            content,
            author: user.name
        });

        const savedAnnouncement = await announcement.save();
        res.status(201).json(savedAnnouncement);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateAnnouncement = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, content } = req.body;
        const user = req.user as UserPayload;

        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            res.status(404).json({ message: 'Announcement not found' });
            return;
        }

        if (title) announcement.title = title;
        if (content) announcement.content = content;

        if (user && user.name) {
            announcement.author = user.name;
        }

        const updatedAnnouncement = await announcement.save();
        res.status(200).json(updatedAnnouncement);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteAnnouncement = async (req: Request, res: Response): Promise<void> => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            res.status(404).json({ message: 'Announcement not found' });
            return;
        }

        await announcement.deleteOne();
        res.status(200).json({ message: 'Announcement deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// --- Settings Controllers ---

export const getSettings = async (_req: Request, res: Response): Promise<void> => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            // Create default settings if none exist
            settings = new Settings();
            await settings.save();
        }
        res.status(200).json(settings);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const { gpaMin, gpaMax, level } = req.body;
        const user = req.user as UserPayload;

        // Validation Logic
        if (gpaMin !== undefined && gpaMax !== undefined && gpaMin >= gpaMax) {
            res.status(400).json({ message: 'الحد الأدنى يجب أن يكون أصغر من الحد الأقصى' });
            return;
        }

        if ((gpaMin !== undefined && (gpaMin < 0 || gpaMin > 5)) ||
            (gpaMax !== undefined && (gpaMax < 0 || gpaMax > 5))) {
            res.status(400).json({ message: 'القيم يجب أن تكون بين 0 و 5' });
            return;
        }

        let settings = await Settings.findOne();
        if (!settings) settings = new Settings();

        if (gpaMin !== undefined) settings.gpaMin = gpaMin;
        if (gpaMax !== undefined) settings.gpaMax = gpaMax;
        if (level !== undefined) settings.level = level;

        if (user && user.name) {
            settings.updatedBy = user.name;
        }

        const updatedSettings = await settings.save();
        res.status(200).json(updatedSettings);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};