import express from 'express';

const router = express.Router();

// Store waiting users and active rooms
let waitingUsers = [];
let activeRooms = new Map();

// Socket.IO handler will be set by app.js
let io = null;

export const setIO = (socketIO) => {
  io = socketIO;
};

export const handleAnonymousSocket = (socket) => {
  console.log('Anonymous socket connected:', socket.id);

  // Find anonymous partner
  socket.on('find_anonymous_partner', ({ userId }) => {
    console.log('User looking for partner:', userId);

    // Check if user is already waiting
    if (waitingUsers.find(u => u.userId === userId)) {
      return;
    }

    // If there's someone waiting, match them
    if (waitingUsers.length > 0) {
      const partner = waitingUsers.shift();
      const roomId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create room
      activeRooms.set(roomId, {
        users: [userId, partner.userId],
        sockets: [socket.id, partner.socketId],
        createdAt: new Date()
      });

      // Join both users to the room
      socket.join(roomId);
      io.sockets.sockets.get(partner.socketId)?.join(roomId);

      // Notify both users
      socket.emit('anonymous_matched', { roomId, partnerId: partner.userId });
      io.to(partner.socketId).emit('anonymous_matched', { roomId, partnerId: userId });

      console.log(`Matched ${userId} with ${partner.userId} in room ${roomId}`);
    } else {
      // Add to waiting list
      waitingUsers.push({ userId, socketId: socket.id });
      socket.emit('anonymous_searching');
      console.log('User added to waiting list:', userId);
    }
  });

  // Send anonymous message
  socket.on('send_anonymous_message', ({ roomId, message, senderId, timestamp }) => {
    console.log('Anonymous message:', { roomId, senderId, message });

    const room = activeRooms.get(roomId);
    if (!room) {
      console.log('Room not found:', roomId);
      return;
    }

    // Broadcast to the other user in the room
    socket.to(roomId).emit('anonymous_message', {
      message,
      senderId,
      timestamp
    });
  });

  // Leave anonymous chat
  socket.on('leave_anonymous', ({ roomId, userId }) => {
    console.log('User leaving anonymous chat:', userId, roomId);

    if (roomId) {
      const room = activeRooms.get(roomId);
      if (room) {
        // Notify partner
        socket.to(roomId).emit('anonymous_partner_disconnected');
        
        // Leave room
        socket.leave(roomId);
        
        // Clean up room
        activeRooms.delete(roomId);
      }
    }

    // Remove from waiting list if present
    waitingUsers = waitingUsers.filter(u => u.userId !== userId && u.socketId !== socket.id);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Anonymous socket disconnected:', socket.id);

    // Remove from waiting list
    const waitingUser = waitingUsers.find(u => u.socketId === socket.id);
    if (waitingUser) {
      waitingUsers = waitingUsers.filter(u => u.socketId !== socket.id);
      console.log('Removed from waiting list:', waitingUser.userId);
    }

    // Find and clean up any active rooms
    for (const [roomId, room] of activeRooms.entries()) {
      if (room.sockets.includes(socket.id)) {
        // Notify partner
        socket.to(roomId).emit('anonymous_partner_disconnected');
        
        // Clean up room
        activeRooms.delete(roomId);
        console.log('Cleaned up room:', roomId);
        break;
      }
    }
  });
};

// Clean up old rooms (optional - run periodically)
setInterval(() => {
  const now = new Date();
  for (const [roomId, room] of activeRooms.entries()) {
    const ageMinutes = (now - room.createdAt) / 1000 / 60;
    if (ageMinutes > 60) { // Remove rooms older than 1 hour
      activeRooms.delete(roomId);
      console.log('Cleaned up old room:', roomId);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

export default router;
