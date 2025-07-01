import { Server } from 'socket.io';
import MessageModel from './models/message.model.js';
import ChatModel from './models/chat.model.js';
import UserModel from './models/user.model.js';

const userSockets = new Map(); // userId -> socketId mapping
const chatRooms = new Map(); // chatId -> Set of userIds

/**
 * Sets up all socket event handlers
 * @param {Object} io - The Socket.IO server instance
 */
const initSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Handle typing indicator
        socket.on('typing', (data) => {
            try {
                if (!data || !data.chatId || !data.userId) {
                    console.warn('Invalid typing event data:', data);
                    return;
                }
                
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

        // When a user connects, store their userId and socketId and set online status
        socket.on('register', async (userId) => {
            if (userId) {
                userSockets.set(userId, socket.id);
                // Update user's online status in database
                await UserModel.findByIdAndUpdate(userId, {
                    isOnline: true,
                    lastSeen: new Date()
                });
                
                // Notify all connected clients about the user's online status
                io.emit('user_status', {
                    userId,
                    isOnline: true,
                    lastSeen: new Date()
                });
                
                console.log(`User ${userId} is now online`);
            }
        });

        // Handle chat messages
        socket.on('send_message', async (data) => {
            try {
                if (!data || !data.roomId || !data.message) {
                    console.warn('Invalid message format:', data);
                    return;
                }

                const { roomId, message: messageData } = data;
                
                // Save message to database
                const newMessage = new MessageModel({
                    senderId: messageData.senderId,
                    receiverId: messageData.receiverId,
                    message: messageData.content,
                    chatId: roomId,
                    isRead: false,
                    timestamp: new Date()
                });

                const savedMessage = await newMessage.save();
                
                // Broadcast to room with saved message data
                io.to(roomId).emit('receive_message', {
                    roomId,
                    message: {
                        _id: savedMessage._id,
                        senderId: savedMessage.senderId,
                        content: savedMessage.message,
                        timestamp: savedMessage.timestamp,
                        chatId: savedMessage.chatId,
                        isRead: savedMessage.isRead
                    }
                });
                
                // console.log(Message saved and sent to room ${roomId} by ${savedMessage.senderId || 'unknown'});
                
                // Emit delivery confirmation
                if (messageData.tempId) {
                    socket.emit('message_delivered', {
                        success: true,
                        tempId: messageData.tempId,
                        messageId: savedMessage._id
                    });
                }
                
            } catch (error) {
                console.error('Error handling send_message:', error);
                // Notify sender of failure
                socket.emit('message_error', {
                    error: 'Failed to send message',
                    tempId: data.message?.tempId,
                    details: error.message
                });
            }
        });

        // Join a chat room
        socket.on('join_room', (data) => {
            try {
                if (!data || !data.roomId) {
                    console.warn('Invalid room join request:', data);
                    return;
                }
                
                const { roomId, userId } = data;
                
                // Join the room
                socket.join(roomId);
                
                // Track room membership
                if (!chatRooms.has(roomId)) {
                    chatRooms.set(roomId, new Set());
                }
                chatRooms.get(roomId).add(userId || socket.id);
                
                // console.log(Socket ${socket.id} joined room ${roomId});
                
                // Notify others in the room
                socket.to(roomId).emit('user_joined', {
                    roomId,
                    userId: userId || socket.id,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error joining room:', error);
            }
        });
        

        // Handle disconnection
        socket.on('disconnect', async () => {
            // Find the user who disconnected
            let disconnectedUserId = null;
            for (const [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    disconnectedUserId = userId;
                    userSockets.delete(userId);
                    break;
                }
            }

            if (disconnectedUserId) {
                // Update user's online status in database
                await UserModel.findByIdAndUpdate(disconnectedUserId, {
                    isOnline: false,
                    lastSeen: new Date()
                });
                
                // Notify all connected clients about the user's offline status
                io.emit('user_status', {
                    userId: disconnectedUserId,
                    isOnline: false,
                    lastSeen: new Date()
                });
                
                console.log(`User ${disconnectedUserId} is now offline`);
            }
            console.log('Client disconnected:', socket.id);
            
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
                    // console.log(User ${userId} disconnected);
                    break;
                }
            }
        });
    });
};

// Function to send a notification to a specific user
const sendNotification = (userIdOrData, notificationData) => {
    let userId, notification;
    
    // Handle both parameter formats
    if (typeof userIdOrData === 'string') {
        userId = userIdOrData;
        notification = notificationData;
    } else if (typeof userIdOrData === 'object') {
        userId = userIdOrData.userId;
        notification = userIdOrData.notification;
    } else {
        console.error('Invalid parameters for sendNotification');
        return false;
    }

    const socketId = userSockets.get(userId);
    if (socketId) {
        const io = require('./api/app.js').io; // Get the shared io instance
        if (io) {
            io.to(socketId).emit('notification', notification);
            // console.log(Notification sent to user ${userId}, notification);
            return true;
        }
    }
    
    // console.log(User ${userId} is not connected);
    return false;
};

// Export the necessary functions and variables
export {
    initSocketHandlers,
    sendNotification,
    userSockets,
    chatRooms
};