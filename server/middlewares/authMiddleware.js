// server/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Admin = require('../models/Admin'); // if you have an admin model

const secret = 'your_jwt_secret_key'; // replace with an environment variable in production

// Verify teacher token
exports.verifyTeacherToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ message: 'Authorization token missing' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, secret);

    // Check if user is a teacher
    const teacher = await Teacher.findById(decoded.id);
    if (!teacher) return res.status(403).json({ message: 'Access denied. Not a teacher.' });

    // Attach teacher info to request
    req.teacherId = teacher._id;
    req.teacher = teacher;

    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token', error: err.message });
  }
};

// Optional: you can also create student/admin verifiers
exports.verifyStudentToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ message: 'Authorization token missing' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, secret);

    const student = await Student.findById(decoded.id);
    if (!student) return res.status(403).json({ message: 'Access denied. Not a student.' });

    req.studentId = student._id;
    req.student = student;

    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token', error: err.message });
  }
};

exports.verifyAdminToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ message: 'Authorization token missing' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, secret);

    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.status(403).json({ message: 'Access denied. Not an admin.' });

    req.adminId = admin._id;
    req.admin = admin;

    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token', error: err.message });
  }
};
