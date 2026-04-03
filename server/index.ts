import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import staffRoutes from './routes/staff.routes';
import subjectRoutes from './routes/subject.routes';
import announcementRoutes from './routes/announcement.routes';
import groupRoutes from './routes/group.routes';
import complaintRoutes from './routes/complaint.routes';

const app = express();

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json());

import './models/department';
import './models/subject';
import './models/student';
import './models/staff';
import './models/passwordResetToken';
import './models/announcement';
import './models/group';
import './models/complaint';

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/complaints', complaintRoutes);

app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/university_db';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Test: http://localhost:${PORT}/api/test`);
            console.log(`Complaints: http://localhost:${PORT}/api/complaints`);
        });
    })
    .catch((err) => {
        console.error('MongoDB error:', err);
    });