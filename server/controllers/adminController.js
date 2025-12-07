// server/controllers/adminController.js
const Admin = require('../models/old/Admin');
const User = require('../models/old/userModel'); // To manage students/teachers
const bcrypt = require('bcryptjs');

// Admin dashboard
exports.dashboard = async (req, res) => {
  try {
    res.status(200).json({ message: `Welcome to the Admin dashboard, ${req.admin.name}` });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// List all users (students and teachers)
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclude passwords
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Create a new user (student or teacher)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const newUser = new User({ name, email, password, role });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully', user: { name, email, role } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Manage users (view all students and teachers)
exports.manageUsers = async (req, res) => {
  try {
    // Fetch all users except admins
    const users = await User.find({ role: { $in: ['student', 'teacher'] } }, '-password');
    
    res.status(200).json({
      message: 'List of users',
      users
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
