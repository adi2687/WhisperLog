const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  } 
});

const PORT = process.env.VIDEO_CALL_PORT || 3001;

// Store active rooms and their participants
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId, userId) => {
    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    
    const room = rooms.get(roomId);
    room.add(socket.id);
    socket.join(roomId);
    
    // Notify other users in the room about new user
    socket.to(roomId).emit("user-connected", { userId: socket.id });
    
    // Send list of existing users to the new user
    const usersInRoom = Array.from(room).filter(id => id !== socket.id);
    socket.emit("existing-users", usersInRoom);
  });

  // WebRTC signaling
  socket.on("offer", (data) => {
    socket.to(data.target).emit("offer", {
      offer: data.offer,
      sender: socket.id
    });
  });

  socket.on("answer", (data) => {
    socket.to(data.target).emit("answer", {
      answer: data.answer,
      sender: socket.id
    });
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.target).emit("ice-candidate", {
      candidate: data.candidate,
      sender: socket.id
    });
  });

  socket.on("disconnect", () => {
    // Find and clean up rooms
    for (const [roomId, users] of rooms.entries()) {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        socket.to(roomId).emit("user-disconnected", { userId: socket.id });
        
        // Clean up empty rooms
        if (users.size === 0) {
          rooms.delete(roomId);
        }
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Video call server running on port ${PORT}`);
});

module.exports = { app, server };
