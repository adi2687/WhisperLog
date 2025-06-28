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
import notificationRoute from '../route/sendnotification.route.js';
import spellCorrectRoute from '../route/messageImprovver.js';
import messageRoute from '../route/message.route.js';
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
app.use('/notification', notificationRoute);
app.use('/messageImprover', spellCorrectRoute);
app.use('/message',messageRoute)
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

// Function to flush messages for a specific chat to the database
const flushBuffer = async (chatId) => {
  if (!chatMessages.has(chatId) || chatMessages.get(chatId).length === 0) {
    return;
  }

  try {
    const messagesToSave = [...chatMessages.get(chatId)];
    if (messagesToSave.length === 0) return;

    // Save messages to database
    const savedMessages = await messageModel.insertMany(
      messagesToSave.map(msg => ({
        ...msg,
        _id: msg._id || undefined, // Let MongoDB generate _id if it's a temp ID
      }))
    );

    // Clear the buffer after saving
    chatMessages.set(chatId, []);

    console.log(`Flushed ${savedMessages.length} messages to database for chat ${chatId}`);
    return savedMessages;
  } catch (error) {
    console.error(`Error flushing messages for chat ${chatId}:`, error);
    // Optionally, you could implement retry logic here
    throw error;
  }
};

// Set up periodic flush (every 15 seconds)
const FLUSH_INTERVAL_MS = 60000;
const flushInterval = setInterval(() => {
  console.log('Running periodic message flush...');
  for (const [chatId, messages] of chatMessages.entries()) {
    if (messages.length > 0) {
      flushBuffer(chatId).catch(error => {
        console.error(`Error in periodic flush for chat ${chatId}:`, error);
      });
    }
  }
}, FLUSH_INTERVAL_MS);

// Clean up interval on server shutdown
process.on('SIGINT', () => {
  clearInterval(flushInterval);
  process.exit(0);
});

process.on('SIGTERM', () => {
  clearInterval(flushInterval);
  process.exit(0);
}); 

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
      // console.log('in typing')
      // Broadcast to all in the chat room except the sender
      socket.to(data.chatId).emit('typing', {
        chatId: data.chatId,
        userId: data.userId,
        username: data.username
      });
      
      // console.log(`User ${data.userId} is typing in chat ${data.chatId}`);
    } catch (error) {
      console.error('Error handling typing event:', error);
    }
  });

  socket.on('joinchat', async ({ chatId }) => {
    if (!chatId) return;
    socket.join(chatId);
  
    try {
      const dbmessages = await messageModel.find({ chatId }).lean();
      const buffermessage = chatMessages.get(chatId) || [];
  
      const allmessages = [...dbmessages, ...buffermessage].map(msg => ({
        _id: msg._id || `temp-${Date.now()}-${Math.random()}`,
        chatId: msg.chatId,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        message: msg.message || '',
        isRead: msg.isRead ?? false,
        timestamp: msg.timestamp || Date.now(),
        imageUrl: msg.imageUrl || null,
        fileUrl: msg.fileUrl || null,
        fileName: msg.fileName || null,
        fileType: msg.fileType || null,
        fileSize: msg.fileSize || null,
        status: msg.status || 'sent',
        createdAt: msg.createdAt || new Date(msg.timestamp || Date.now()),
        updatedAt: msg.updatedAt || new Date(msg.timestamp || Date.now()),
      }));
  
      // Optional: sort by createdAt
      allmessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
      socket.emit('loadMessages', allmessages);
      console.log('loading messages', allmessages.length);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  });
  

  socket.on('message', async ({ 
    chatId, message, senderId, receiverId, imageUrl, 
    fileUrl, fileName, fileType, fileSize, tempMessageId, _id 
  }) => {
    try {
      // console.log('New message received:', { 
      //   tempMessageId,
      //   _id,
      //   chatId, 
      //   senderId, 
      //   receiverId, 
      //   message: message ? `${message.substring(0, 30)}${message.length > 30 ? '...' : ''}` : 'No text',
      //   hasImage: !!imageUrl,
      //   hasFile: !!fileUrl,
      //   fileType: fileType || 'N/A'
      // });
  
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
  // limit of 10 messaegs per chat 
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
          serverId: null, // not yet stored in DB
          status: 'buffered'
        };
      }
  
      // Emit message to all clients in the chat room
      io.to(chatId).emit('message', messageData);

      // Acknowledge to sender with current status
      if (tempMessageId) {
        io.to(socket.id).emit(`message_ack_${tempMessageId}`, messageData);
      }
  
    } catch (error) {
      console.error('Error handling message:', error);
      // Notify sender of the error
      if (tempMessageId) {
        io.to(socket.id).emit('messageError', {
          tempMessageId,
          message: 'Message could not be processed'
        });
      }
    }
  });
  
  
});


server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
