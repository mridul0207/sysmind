const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { userId: this._id, email: this.email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1h' }
  );
};

module.exports = mongoose.model('User', userSchema);
