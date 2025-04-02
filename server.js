require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'PORT'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1); // Exit if any required variable is missing
  }
}

const app = express();
app.use("/uploads", express.static("uploads"));
app.use(morgan("dev"))
// ✅ CORS Configuration (Allow frontend requests)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*', // Allow requests from frontend
    credentials: true, // Allow cookies and credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  })
);

// ✅ Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// ✅ Log environment variables (Security masked)
console.log('✅ Environment variables loaded:', {
  MONGO_URI: process.env.MONGO_URI ? '***' : 'Not set',
  JWT_SECRET: process.env.JWT_SECRET ? '***' : 'Not set',
  PORT: process.env.PORT,
  FRONTEND_URL: process.env.FRONTEND_URL,
});

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// ✅ Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

// ✅ Start the server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ✅ Graceful Shutdown Handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down...');
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});

// ✅ Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
