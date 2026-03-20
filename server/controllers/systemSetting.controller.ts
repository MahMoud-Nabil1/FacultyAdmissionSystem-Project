import { Request, Response } from 'express';
import SystemSetting from '../models/systemSetting';

export const getSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        let settings = await SystemSetting.findOne();
        if (!settings) {
            settings = await SystemSetting.create({
                registrationOpen: true,
                withdrawalOpen: true
            });
        }
        res.json(settings);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const { registrationOpen, withdrawalOpen } = req.body;
        let settings = await SystemSetting.findOne();
        if (!settings) {
            settings = new SystemSetting();
        }

        if (registrationOpen !== undefined) settings.registrationOpen = registrationOpen;
        if (withdrawalOpen !== undefined) settings.withdrawalOpen = withdrawalOpen;

        await settings.save();
        res.json(settings);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
