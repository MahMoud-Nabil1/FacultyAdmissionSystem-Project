const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const jwt = require("jsonwebtoken");

const app = express();


app.use(cors());
app.use(express.json());


require('./models/department');
require('./models/subject');
require('./models/student');
require('./models/staff');
require('./models/passwordResetToken');


const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const staffRoutes = require('./routes/staff.routes');

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/staff', staffRoutes);


app.get('/', (req, res) => {
    res.json({ message: 'Faculty Admission System API is running' });
});


const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/faculty-admission';

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 })
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    });

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);

            if (!allowedRoles.includes(payload.role)) {
                return res.status(403).json({ error: "Forbidden" });
            }

            req.user = payload;
            next();
        } catch {
            res.status(401).json({ error: "Invalid token" });
        }
    };
}
