const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = "your_secret_key";

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/doctors', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const doctorSchema = new mongoose.Schema({
  doctorId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  qualifications: { type: String, required: true },
  contact: {
    address: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
  },
  availability: { type: String, required: true },
});

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

const Doctor = mongoose.model('Doctor', doctorSchema);
const User = mongoose.model('User', userSchema);

// User Registration
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Access denied' });

  jwt.verify(token.split(' ')[1], SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Add doctor (Protected Route)
app.post('/doctors', authenticateToken,
  [
    body('doctorId').notEmpty(),
    body('name').notEmpty(),
    body('specialty').notEmpty(),
    body('qualifications').notEmpty(),
    body('contact.address').notEmpty(),
    body('contact.phone').isMobilePhone(),
    body('contact.email').isEmail(),
    body('availability').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const newDoctor = new Doctor(req.body);
      await newDoctor.save();
      res.status(201).json(newDoctor);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get all doctors (Protected Route)
app.get('/doctors', authenticateToken, async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
