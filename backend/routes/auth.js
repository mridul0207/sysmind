const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create user (password is hashed in pre-save hook)
    const user = new User({ email, password });
    await user.save();
    
    // Generate token
    const token = user.generateAuthToken();
    
    res.status(201).json({ 
      userId: user._id, 
      email: user.email, 
      token 
    });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = user.generateAuthToken();
    
    res.json({ 
      userId: user._id, 
      email: user.email, 
      token 
    });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

module.exports = router;