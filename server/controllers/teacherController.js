// server/controllers/teacherController.js
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// Teacher dashboard - just an example response
exports.dashboard = async (req, res) => {
  try {
    // You could return teacher info or stats here
    const teacher = await Teacher.findById(req.teacherId).select('-password');
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    res.json({
      message: `Welcome to your dashboard, ${teacher.name}`,
      teacher,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List all students
exports.listStudents = async (req, res) => {
  try {
    const students = await Student.find().select('-password'); // don't send passwords
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
