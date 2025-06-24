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

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on('joinchat', ({ chatId }) => {
    if (!chatId) return;
    socket.join(chatId);
    console.log('joined chat', chatId);

    // Send existing messages to the new client
    const messages = chatMessages[chatId] || [];
    socket.emit('loadMessages', messages);
  });

  socket.on('message', ({ chatId, message }) => {
    const msgObj = { message, timestamp: Date.now() };

    // Save the message in memory
    if (!chatMessages[chatId]) {
      chatMessages[chatId] = [];
    }
    chatMessages[chatId].push(msgObj);

    // Send the message to all clients in the room
    io.to(chatId).emit('message', msgObj);
    console.log('message sent', msgObj);
  });
});


server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
