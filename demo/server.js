require('dotenv').config();

// Add this check after the dotenv config
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set in the environment variables');
  process.exit(1);
}

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

// Update the User model to include customFilter and role
const User = mongoose.model('User', new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  customFilter: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}));

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Update the registration route
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, role, adminSecret } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check if trying to create an admin user
    let userRole = 'user';
    if (role === 'admin') {
      // Verify admin secret
      if (adminSecret !== process.env.ADMIN_SECRET) {
        return res.status(403).json({ message: 'Invalid admin secret' });
      }
      userRole = 'admin';
    }

    // Create new user
    user = new User({ 
      email, 
      password: hashedPassword, 
      role: userRole
    });
    await user.save();

    // Create and send token
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET);
    res.status(201).json({ token, role: user.role });
  } catch (error) {
    console.error('Server error during registration:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Update the login route
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
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ 
      token,
      role: user.role,
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

// Update the /api/users route
app.get('/api/users', async (req, res) => {
  try {
    console.log('Received request for /api/users');
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);
    if (!authHeader) {
      console.log('No authorization header provided');
      return res.status(401).json({ message: 'No authorization header provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token:', token);
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);
    } catch (err) {
      console.log('Invalid token:', err.message);
      return res.status(401).json({ message: 'Invalid token', error: err.message });
    }

    const users = await User.find({}, '-password');
    console.log('Users fetched successfully:', users);
    res.json(users);
  } catch (error) {
    console.error('Error in /api/users route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Catch-all route (keep this at the end, but modify it)
app.get('*', (req, res) => {
  console.log('Catch-all route hit:', req.url);
  if (req.url.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  if (!req.accepts('html')) {
    return res.sendStatus(404);
  }
  res.sendFile(path.join(__dirname, 'auth.html'));
});

const PORT = process.env.PORT || 5001;  // Changed to 5001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Add this line to serve files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler caught an error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Add this new route after your existing routes
app.delete('/api/users/:userId', async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if the user making the request is an admin
    const requestingUser = await User.findById(decoded.userId);
    if (requestingUser.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete users' });
    }

    const userId = req.params.userId;
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
