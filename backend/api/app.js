import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';
dotenv.config();
const mongoUrl = process.env.MONGODB_URI;

// MongoDB connection
import connect from '../db/connection.js';
connect(mongoUrl);

// Routes
import userRegister from '../route/user.register.js';
import userLogin from '../route/user.login.js';
import userRoutes from '../route/users.route.js';
import ProfileRoues from '../route/profile.routes.js';
import searchnewfriendsRoute from '../route/searchnewfriends.route.js';
import friendRequestRoute from '../route/friendrequest.route.js';
import logoutRoute from '../route/logout.route.js';
import messageRoute from '../route/message.route.js';
import notificationRoute from '../route/sendnotification.route.js';

const PORT = process.env.PORT || 5000;
const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
const app = express();
const server = http.createServer(app);

// CORS configuration
const allowedOrigins = [frontend, 'http://localhost:5173', 'https://whisperlog.vercel.app'];

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
app.use('/notification', notificationRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    params: req.params,
    query: req.query,
    headers: req.headers
  });

  // Handle multer errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
      code: err.code,
      field: err.field
    });
  }

  // Handle other errors
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true
  },
  pingTimeout: 60000, // optional
  pingInterval: 25000
});

const chatMessages = new Map();
import messageModel from '../models/message.model.js'; 

// Store active video call rooms and their participants

// Handle video call connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Video call room management
  

  // Handle chat functionality
  socket.on('typing', (data) => {
    try {
      if (!data || !data.chatId || !data.userId) {
        console.log(data,data.chatId,data.userId)
        console.warn('Invalid typing event data:', data);
        return;
      }
      console.log('in typing')
      // Broadcast to all in the chat room except the sender
      socket.to(data.chatId).emit('typing', {
        chatId: data.chatId,
        userId: data.userId,
        username: data.username
      });
      
      console.log(`User ${data.userId} is typing in chat ${data.chatId}`);
    } catch (error) {
      console.error('Error handling typing event:', error);
    }
  });

  socket.on('joinchat', async ({ chatId }) => {
    if (!chatId) return;
    socket.join(chatId);
    // console.log('joined chat', chatId);

    // Send existing messages to the new client
    try {
      const messages = await messageModel.find({ chatId }).lean();
      socket.emit('loadMessages', messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  });

  socket.on('message', async ({ 
    chatId, message, senderId, receiverId, imageUrl, 
    fileUrl, fileName, fileType, fileSize, tempMessageId, _id 
  }) => {
    try {
      console.log('New message received:', { 
        tempMessageId,
        _id,
        chatId, 
        senderId, 
        receiverId, 
        message: message ? `${message.substring(0, 30)}${message.length > 30 ? '...' : ''}` : 'No text',
        hasImage: !!imageUrl,
        hasFile: !!fileUrl,
        fileType: fileType || 'N/A'
      });
  
      if (!chatMessages.has(chatId)) {
        chatMessages.set(chatId, []);
      }
  
      const newMsg = {
        _id: _id?.startsWith('temp-') ? undefined : _id,
        chatId,
        message: message || '',
        timestamp: Date.now(),
        senderId,
        receiverId,
        isRead: false,
        imageUrl: imageUrl || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
        fileSize: fileSize || null,
        status: 'delivered'
      };
  
      chatMessages.get(chatId).push(newMsg);
  
      let messageData;
  
      if (chatMessages.get(chatId).length >= 10) {
        const messagesToSave = chatMessages.get(chatId);
  
        const savedMessages = await messageModel.insertMany(
          messagesToSave.map(msg => ({
            ...msg,
            _id: msg._id || undefined, // Ensure DB generates _id if temp
          }))
        );
  
        // Clear the buffer after saving
        chatMessages.set(chatId, []);
  
        // Use the last saved message for broadcast/ack
        const lastSaved = savedMessages[savedMessages.length - 1];
        messageData = {
          ...lastSaved.toObject(),
          tempMessageId,
          serverId: lastSaved._id,
          status: 'delivered'
        };
  
      } else {
        // Message still in memory (not yet flushed to DB)
        messageData = {
          ...newMsg,
          _id: _id || `temp-${Date.now()}`,
          tempMessageId,
          serverId: _id || null
        };
      }
  
      // Emit to room or user
      if (chatId) {
        io.to(chatId).emit('message', messageData);
      } else {
        io.to(receiverId).emit('message', messageData);
      }
  
      // Acknowledge to sender
      if (tempMessageId) {
        io.to(socket.id).emit(`message_ack_${tempMessageId}`, {
          ...messageData,
          status: 'delivered'
        });
      }
  
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
  
  
});


server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
