import { Server } from 'socket.io';

let io;
const userSockets = new Map(); // userId -> socketId mapping

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // When a user connects, store their userId and socketId
        socket.on('register', (userId) => {
            if (userId) {
                userSockets.set(userId, socket.id);
                console.log(`User ${userId} connected with socket ${socket.id}`);
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            // Remove the user from our mapping
            for (const [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
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
    if (!io) {
        console.error('Socket.IO not initialized');
        return false;
    }

    // Handle both parameter formats:
    // 1. sendNotification(userId, notification)
    // 2. sendNotification({ userId, ...notification })
    let userId, notification;
    
    if (typeof userIdOrData === 'string') {
        // Format 1: userId, notification
        userId = userIdOrData;
        notification = notificationData;
    } else if (userIdOrData && typeof userIdOrData === 'object') {
        // Format 2: single object with userId and notification data
        userId = userIdOrData.userId;
        notification = { ...userIdOrData };
    } else {
        console.error('Invalid parameters for sendNotification');
        return false;
    }

    if (!userId) {
        console.error('No userId provided for notification');
        return false;
    }

    const socketId = userSockets.get(userId);
    if (socketId) {
        io.to(socketId).emit('newNotification', notification);
        console.log(`Notification sent to user ${userId}`, notification);
        return true;
    } else {
        console.log(`User ${userId} is not connected`);
        return false;
    }
};

export { initSocket, sendNotification, io };
