const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const staffRoutes = require('./routes/staff.routes');
const subjectRoutes = require('./routes/subject.routes');
const announcementRoutes = require('./routes/announcement.routes');
const groupRoutes = require('./routes/group.routes');

const app = express();

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

require('./models/department');
require('./models/subject');
require('./models/student');
require('./models/staff');
require('./models/passwordResetToken');
require('./models/announcementSchema');
require('./models/group');

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/groups', groupRoutes);

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ message: err.message || 'Something went wrong' });
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(process.env.PORT || 5000, () => {
            console.log(`Server running on port ${process.env.PORT || 5000}`);
        });
    })
    .catch(err => {
        console.error(err.message);
        process.exit(1);
    });

module.exports = app;