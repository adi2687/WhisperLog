import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

// MongoDB connection
import connect from '../db/connection.js';
connect('mongodb://localhost:27017/whisperlog');

// Routes
import userRegister from '../route/user.register.js';
import userLogin from '../route/user.login.js';
import userRoutes from '../route/users.route.js';
import ProfileRoues from '../route/profile.routes.js';
import searchnewfriendsRoute from '../route/searchnewfriends.route.js';
import friendRequestRoute from '../route/friendrequest.route.js';

const PORT = process.env.PORT || 5000;
const app = express();

// CORS configuration
const allowedOrigins = ['http://localhost:5173', 'http://192.168.1.7:5173'];

// Enable CORS for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Check if the origin is in the allowed list
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});
app.use(express.json());
app.use(cookieParser());

// REST API routes
app.get('/', (req, res) => {
  res.send('Main page');
});

app.use('/auth/register', userRegister);
app.use('/auth/login', userLogin);
app.use('/visitfriend', userRoutes);
app.use('/api/profile', ProfileRoues);
app.use('/search/newfriends', searchnewfriendsRoute);
// Mount all friend-related routes under /friends
app.use('/friends', friendRequestRoute);

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.IO to HTTP server
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://192.168.1.7:5173'],
    methods: ['GET', 'POST']
  }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('roomJoin', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('msg', ({ roomId, text }) => {
    io.to(roomId).emit('msg', text);
  });

  socket.on('sendNotification', ({ toUserId, notification }) => {
    // Custom logic to emit notification to specific user (if socket.id or room stored)
    io.to(toUserId).emit('notification', notification);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
