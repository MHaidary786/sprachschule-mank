const Student = require('../models/old/Student');

exports.createStudent = async (req, res) => {
  try {
    const { name, email, password, courses } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student already exists' });
    }

    // Create new student
    const newStudent = new Student({
      name,
      email,
      password,
      courses
    });

    await newStudent.save();

    // Remove password from response
    const studentData = newStudent.toObject();
    delete studentData.password;

    res.status(201).json({ message: 'Student created successfully', student: studentData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find().select('-password');
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getStudentByName = async (req, res) => {
  try {
    const studentName = req.params.name;
    const student = await Student.findOne({ name: studentName }).select('-password');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    } 
    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

