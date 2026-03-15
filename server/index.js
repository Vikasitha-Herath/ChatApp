require('dotenv').config();
const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors     = require('cors');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: true, methods: ['GET','POST','PUT','DELETE'], credentials: true }
});

app.use(cors({ origin: true, credentials: true }));
app.options('*', cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// User routes
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/chat',    require('./routes/chat'));
app.use('/api/payment', require('./routes/payment'));

// Admin routes
app.use('/api/admin/auth',       require('./routes/adminAuth'));
app.use('/api/admin/dashboard',  require('./routes/adminDashboard'));
app.use('/api/admin/users',      require('./routes/adminUsers'));
app.use('/api/admin/promotions', require('./routes/adminPromotions'));
app.use('/api/admin',            require('./routes/adminManage'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Sync API is running', timestamp: new Date() });
});
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Sync Server', version: '1.0.0' });
});
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

require('./socket')(io);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sync Server running on 0.0.0.0:${PORT}`);
    console.log(`📡 Socket.IO ready`);
    console.log(`🛡  Admin: /api/admin`);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
process.on('SIGTERM', () => {
  server.close(() => { mongoose.connection.close(); process.exit(0); });
});