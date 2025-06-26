import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';
dotenv.config();
const mongoUrl=process.env.MONGODB_URI;
// console.log(mongoUrl)
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
const frontend=process.env.FRONTEND_URL;
const app = express();

// CORS configuration
const allowedOrigins = [frontend,'http://localhost:5173','https://whisperlog.vercel.app'];

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

const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  pingTimeout: 60000, // optional
  pingInterval: 25000
});

const chatMessages = {};
import messageModel from '../models/message.model.js'; 

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  // Handle typing indicator
  socket.on('typing', (data) => {
    try {
      if (!data || !data.chatId || !data.userId) {
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

  socket.on('message', async ({ chatId, message, senderId, receiverId, imageUrl, fileUrl, fileName, fileType, fileSize }) => {
    try {
      console.log('New message:', { chatId, senderId, receiverId, message, imageUrl, fileUrl, fileName, fileType, fileSize });
      
      // Create and save the message
      const newMessage = new messageModel({
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
        fileSize: fileSize || null
      });
      
      const savedMessage = await newMessage.save();
      
      // Convert to plain object and remove any circular references
      const messageObj = savedMessage.toObject();
      
      // Send the message to all clients in the room
      io.to(chatId).emit('message', {
        _id: messageObj._id,
        chatId: messageObj.chatId,
        message: messageObj.message,
        timestamp: messageObj.timestamp,
        senderId: messageObj.senderId,
        receiverId: messageObj.receiverId,
        isRead: messageObj.isRead,
        imageUrl: messageObj.imageUrl || null,
        fileUrl: messageObj.fileUrl || null,
        fileName: messageObj.fileName || null,
        fileType: messageObj.fileType || null,
        fileSize: messageObj.fileSize || null,
        createdAt: messageObj.createdAt
      });
      
      // Also emit to the sender and receiver for real-time updates in their chat lists
      io.to(senderId).emit('message', messageObj);
      io.to(receiverId).emit('message', messageObj);
      
      console.log('Message saved and emitted:', messageObj);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
});


server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
