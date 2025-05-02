require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('../../routes/auth');
const { createServer } = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Message = require('./models/Message');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

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

// Add route to fetch chat history
app.get('/api/messages', async (req, res) => {
  try {
    const { roomId, userId } = req.query;
    let query = {};
    
    if (roomId) {
      query.room = roomId;
      query.isPrivate = false;
    } else if (userId) {
      query.$or = [
        { sender: userId },
        { recipient: userId }
      ];
      query.isPrivate = true;
    }
    
    const messages = await Message.find(query)
      .sort({ timestamp: 1 })
      .populate('sender recipient', 'email');
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Track online users, rooms, and typing users
const onlineUsers = {};
const rooms = {};
const typingUsers = {};

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Add user to online list
  socket.on('user online', (userId) => {
    onlineUsers[userId] = socket.id;
    io.emit('online users', Object.keys(onlineUsers));
  });

  // Handle chat messages with timestamp
  socket.on('chat message', async ({ roomId, message, senderId }) => {
    const timestamp = new Date();
    
    // Save to database
    const newMessage = new Message({
      sender: senderId,
      room: roomId,
      content: message,
      timestamp,
      isPrivate: false
    });
    
    await newMessage.save();
    
    if (roomId) {
      // Room message
      io.to(roomId).emit('chat message', { 
        senderId, 
        message, 
        timestamp: timestamp.toISOString(),
        id: newMessage._id
      });
    } else {
      // Broadcast to all
      io.emit('chat message', { 
        senderId, 
        message, 
        timestamp: timestamp.toISOString(),
        id: newMessage._id
      });
    }
  });

  // Handle private messages with timestamp
  socket.on('private message', async ({ recipientId, message, senderId }) => {
    const timestamp = new Date();
    const recipientSocketId = onlineUsers[recipientId];
    
    // Save to database
    const newMessage = new Message({
      sender: senderId,
      recipient: recipientId,
      content: message,
      timestamp,
      isPrivate: true
    });
    
    await newMessage.save();
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('private message', { 
        senderId, 
        message, 
        timestamp: timestamp.toISOString(),
        id: newMessage._id
      });
    }
  });

  // Handle typing indicators
  socket.on('typing', ({ roomId, userId, isTyping }) => {
    if (roomId) {
      // Room typing indicator
      if (isTyping) {
        typingUsers[userId] = roomId;
      } else {
        delete typingUsers[userId];
      }
      io.to(roomId).emit('typing users', Object.keys(typingUsers).filter(id => typingUsers[id] === roomId));
    }
  });

  // Handle room joining and send history
  socket.on('join room', async (roomId) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = new Set();
    }
    rooms[roomId].add(socket.id);
    console.log(`User ${socket.id} joined room ${roomId}`);
    
    // Send message history for this room
    const messages = await Message.find({ room: roomId, isPrivate: false })
      .sort({ timestamp: 1 })
      .populate('sender', 'email');
    
    socket.emit('chat history', messages.map(msg => ({
      id: msg._id,
      senderId: msg.sender._id,
      senderEmail: msg.sender.email,
      message: msg.content,
      timestamp: msg.timestamp.toISOString()
    })));
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
    // Remove user from typing indicators
    Object.keys(typingUsers).forEach(typingUserId => {
      if (typingUserId === userId) {
        delete typingUsers[userId];
        io.to(typingUsers[userId]).emit('typing users', Object.keys(typingUsers).filter(id => typingUsers[id] === typingUsers[userId]));
      }
    });
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 