import { Server } from 'socket.io';

const userSockets = new Map(); // userId -> socketId mapping
const chatRooms = new Map(); // chatId -> Set of userIds

/**
 * Sets up all socket event handlers
 * @param {Object} io - The Socket.IO server instance
 */
const initSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // When a user connects, store their userId and socketId
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
                    console.log(`User ${userId} disconnected`);
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
        const io = require('./api/app').io; // Get the shared io instance
        if (io) {
            io.to(socketId).emit('notification', notification);
            console.log(`Notification sent to user ${userId}`, notification);
            return true;
        }
    }
    
    console.log(`User ${userId} is not connected`);
    return false;
};

// Export the necessary functions and variables
export {
    initSocketHandlers,
    sendNotification,
    userSockets,
    chatRooms
};
