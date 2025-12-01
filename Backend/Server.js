import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./Database/config.js";
import AdminRoute from "./Route/Admin_Routes.js";
import userRoute from "./Route/User_Routes.js";
import LoginRouter from "./Route/Login_Routes.js";
import PartyRouter from "./Route/Party_Routes.js";
import CandidateRouter from "./Route/Candidate_Routes.js";
import ApprovalRouter from "./Route/Approval_Route.js";
import electionRouter from "./Route/Election_Routes.js";
import ipfsRouter from "./Route/Ipfs_Routes.js";
import VoteRouter from "./Route/Vote_Routes.js";
import fetch from "node-fetch"; // Make sure to install: npm install node-fetch

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || "https://decentralized-final.vercel.app",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/admin', AdminRoute);
app.use('/user', userRoute);
app.use('/login', LoginRouter);
app.use('/party', PartyRouter);
app.use('/candidate', CandidateRouter);
app.use('/approval', ApprovalRouter);
app.use('/election', electionRouter);
app.use('/vote', VoteRouter);
app.use('/ipfs', ipfsRouter);

// Basic route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Decentralized Voting API is running!',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Health check route (important for monitoring)
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Decentralized Voting System',
        database: 'Connected', // You might want to check DB status here
        uptime: process.uptime()
    });
});

// Error handling middleware (add at the end)
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: {
            message: err.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server started at port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'https://decentralized-final.vercel.app'}`);
    
    // Self-ping to keep Render instance alive (only in production)
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SELF_PING === 'true') {
        const backendUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
        
        console.log(`🔄 Self-ping enabled for: ${backendUrl}`);
        
        // Initial ping after 10 seconds
        setTimeout(() => {
            pingServer(backendUrl);
        }, 10000);
        
        // Periodic ping every 14 minutes (Render free tier sleeps after 15 min inactivity)
        setInterval(() => {
            pingServer(backendUrl);
        }, 14 * 60 * 1000); // 14 minutes
    }
});

// Self-ping function
const pingServer = async (url) => {
    try {
        const response = await fetch(`${url}/health`);
        console.log(`✅ Self-ping success: ${response.status} - ${new Date().toISOString()}`);
    } catch (error) {
        console.error(`❌ Self-ping failed: ${error.message} - ${new Date().toISOString()}`);
    }
};

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    server.close(() => {
        process.exit(1);
    });
});