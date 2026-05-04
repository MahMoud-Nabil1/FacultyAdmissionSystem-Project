import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authMiddleware';
import Student from '../models/student';
import Staff from '../models/staff';

const router = Router();

// Configure memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid image format. Only JPEG, PNG, and WebP are allowed.') as any, false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

router.post('/avatar', authenticate, (req: any, res: Response) => {
    upload.single('avatar')(req, res, async (err: any) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Please upload an image' });
        }

        try {
            const userId = req.user.id;
            const role = req.user.role;
            
            // Convert to Base64 data URL
            const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

            if (base64Image.length > 3 * 1024 * 1024) { // Roughly 3MB limit
                return res.status(400).json({ error: 'Image is too large after processing' });
            }

            let user;
            if (role === 'student') {
                user = await Student.findOneAndUpdate({ studentId: userId }, { avatar: base64Image }, { new: true });
            } else {
                user = await Staff.findByIdAndUpdate(userId, { avatar: base64Image }, { new: true });
            }

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({
                message: 'Avatar updated successfully',
                avatarUrl: base64Image
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });
});

router.get('/avatar/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        let user;
        
        // Try staff first, then student
        user = await Staff.findById(userId).select('avatar');
        if (!user || !user.avatar) {
            const studentId = Number(userId);
            if (!isNaN(studentId)) {
                user = await Student.findOne({ studentId }).select('avatar');
            }
        }

        if (!user || !user.avatar) {
            return res.status(404).json({ error: 'Avatar not found' });
        }

        // Return the avatar string
        res.json({ avatar: user.avatar });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
