require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('../../routes/auth');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);

// Track online users and rooms
const onlineUsers = {};
const rooms = {};

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Add user to online list
  socket.on('user online', (userId) => {
    onlineUsers[userId] = socket.id;
    io.emit('online users', Object.keys(onlineUsers));
  });

  // Handle chat messages
  socket.on('chat message', ({ roomId, message, senderId }) => {
    if (roomId) {
      // Room message
      io.to(roomId).emit('chat message', { senderId, message });
    } else {
      // Broadcast to all
      io.emit('chat message', { senderId, message });
    }
  });

  // Handle private messages
  socket.on('private message', ({ recipientId, message, senderId }) => {
    const recipientSocketId = onlineUsers[recipientId];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('private message', { senderId, message });
    }
  });

  // Handle room joining
  socket.on('join room', (roomId) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = new Set();
    }
    rooms[roomId].add(socket.id);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Handle room leaving
  socket.on('leave room', (roomId) => {
    socket.leave(roomId);
    if (rooms[roomId]) {
      rooms[roomId].delete(socket.id);
      if (rooms[roomId].size === 0) {
        delete rooms[roomId];
      }
    }
    console.log(`User ${socket.id} left room ${roomId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove user from online list
    const userId = Object.keys(onlineUsers).find(key => onlineUsers[key] === socket.id);
    if (userId) {
      delete onlineUsers[userId];
      io.emit('online users', Object.keys(onlineUsers));
    }
    // Remove user from all rooms
    Object.keys(rooms).forEach(roomId => {
      if (rooms[roomId].has(socket.id)) {
        rooms[roomId].delete(socket.id);
        if (rooms[roomId].size === 0) {
          delete rooms[roomId];
        }
      }
    });
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 