const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const multer = require('multer'); // Add this line
const fs = require('fs'); // Add this line as well
require('dotenv').config();

const app = express();

// Add this near the top of your file, after other imports
const mime = require('mime-types');

// Add this middleware before your routes
app.use((req, res, next) => {
  if (req.url.endsWith('.js')) {
    res.type(mime.lookup('js'));
  }
  next();
});

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files from the current directory and its parent
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, '..')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Update the User model to include customFilter
const User = mongoose.model('User', new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  customFilter: { type: String }
}));

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({ email, password: hashedPassword });
    await user.save();

    // Create and send token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.status(201).json({ token });
  } catch (error) {
    console.error('Server error during registration:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Update the login route to include customFilter information
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Create and send token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ 
      token,
      hasCustomFilter: !!user.customFilter,
      customFilterPath: user.customFilter
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// New route for image upload
app.post('/api/upload-filter', upload.single('image'), async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const oldPath = req.file.path;
    const newPath = path.join('uploads', `${user._id}_${req.file.originalname}`);

    fs.renameSync(oldPath, newPath);

    user.customFilter = newPath;
    await user.save();

    res.json({ message: 'Filter uploaded successfully', imageUrl: newPath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Catch-all route to serve the frontend for any unmatched routes
app.get('*', (req, res) => {
  if (!req.accepts('html')) {
    return res.sendStatus(404);
  }
  res.sendFile(path.join(__dirname, 'auth.html'));
});

const PORT = process.env.PORT || 5001;  // Changed to 5001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Add this line to serve files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));