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
import logoutRoute from '../route/logout.route.js';
import messageRoute from '../route/message.route.js';

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
app.use('/logout', logoutRoute);
app.use('/message', messageRoute);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://192.168.1.7:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000  // 25 seconds
});

// Make io instance available to routes
app.set('io', io);

// Store user socket connections and chat rooms
const userSockets = new Map(); // userId -> socketId
const chatRooms = new Map();   // chatId -> Set of userIds

// Make these available to routes
app.set('userSockets', userSockets);
app.set('chatRooms', chatRooms);

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Register user with their socket
  socket.on('register', (userId) => {
    if (userId) {
      userSockets.set(userId, socket.id);
      console.log(`User ${userId} connected with socket ${socket.id}`);
    }
  });

  // Join a chat room
  socket.on('join_chat', ({ chatId, userId }) => {
    if (chatId && userId) {
      socket.join(chatId);
      
      // Track users in chat rooms
      if (!chatRooms.has(chatId)) {
        chatRooms.set(chatId, new Set());
      }
      chatRooms.get(chatId).add(userId);
      
      console.log(`User ${userId} joined chat ${chatId}`);
    }
  });

  // Handle new messages
  socket.on('send_message', (messageData) => {
    try {
      const { chatId, senderId, receiverId, content } = messageData;
      
      // Broadcast the message to all users in the chat room
      io.to(chatId).emit('new_message', {
        ...messageData,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Message sent in chat ${chatId} by user ${senderId}`);
      
      // Send notification to receiver if they're not in the chat
      const receiverSocketId = userSockets.get(receiverId);
      if (receiverSocketId && !io.sockets.sockets.get(receiverSocketId)?.rooms.has(chatId)) {
        io.to(receiverSocketId).emit('new_notification', {
          type: 'new_message',
          chatId,
          senderId,
          content,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove the user from our mapping and all chat rooms
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        // Remove user from all chat rooms
        for (const [chatId, users] of chatRooms.entries()) {
          if (users.has(userId)) {
            users.delete(userId);
            if (users.size === 0) {
              chatRooms.delete(chatId);
            }
          }
        }
        
        // Remove user from socket mapping
        userSockets.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
