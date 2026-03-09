const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const jwt = require("jsonwebtoken");

// Import routes
const subjectRoutes = require('./routes/subject.routes');
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const staffRoutes = require('./routes/staff.routes');
const announcementRoutes = require('./routes/announcement.routes');
const groupRoutes = require('./routes/group.routes');

const app = express();

// CORS configuration for Express v5
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware for Express v5
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import models (ensure these files exist)
try {
    require('./models/department');
    require('./models/subject');
    require('./models/student');
    require('./models/staff');
    require('./models/passwordResetToken');
    require('./models/announcementSchema');
    require('./models/group');
} catch (error) {
    console.log('⚠️ Some models not found:', error.message);
}

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/groups', groupRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        express: 'v5',
        mongoose: 'v9'
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Faculty Admission System API is running',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            students: '/api/students',
            staff: '/api/staff',
            subjects: '/api/subjects',
            announcements: '/api/announcements',
            groups: '/api/groups',
            health: '/health'
        }
    });
});

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
    console.error('Please check your .env file');
    process.exit(1);
}

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// MongoDB connection options for Mongoose v9
const mongooseOptions = {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4
};

// Connect to MongoDB using async/await (modern approach)
const connectToMongoDB = async () => {
    try {
        console.log('🔄 Connecting to MongoDB Atlas...');

        await mongoose.connect(MONGO_URI, mongooseOptions);

        console.log('✅ Connected to MongoDB Atlas');

        // Start server after successful connection
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📝 API Documentation available at http://localhost:${PORT}/`);
            console.log(`🔍 Health check at http://localhost:${PORT}/health`);
        });

    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.error('\n🔍 Debugging information:');
        console.error('1. Check if MongoDB Atlas IP whitelist includes your IP');
        console.error('2. Verify username and password in connection string');
        console.error('3. Ensure database name is correct');
        console.error('4. Check if cluster is running (AWS/GCP/Azure status)');

        if (error.name === 'MongooseServerSelectionError') {
            console.error('\n🛠️ Solution: Go to MongoDB Atlas → Network Access → Add IP Address');
            console.error('   Add your current IP or use 0.0.0.0/0 for testing');
        }

        if (error.message.includes('bad auth')) {
            console.error('\n🛠️ Solution: Wrong username or password');
            console.error('   Go to MongoDB Atlas → Database Access → Reset password');
        }

        process.exit(1);
    }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
    console.log('✅ Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ Mongoose disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Mongoose connection closed due to app termination');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await mongoose.connection.close();
    console.log('Mongoose connection closed due to app termination');
    process.exit(0);
});

// Start the server
connectToMongoDB();

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        message: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Error handling middleware for Express v5
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Validation Error',
            errors: err.errors
        });
    }

    if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            message: 'Invalid token or no token provided'
        });
    }

    if (err.name === 'MongoServerError' && err.code === 11000) {
        return res.status(400).json({
            message: 'Duplicate key error',
            field: Object.keys(err.keyPattern)[0]
        });
    }

    // Default error response
    res.status(500).json({
        message: 'Something went wrong!',
        ...(process.env.NODE_ENV === 'development' && { error: err.message, stack: err.stack })
    });
});

module.exports = app;