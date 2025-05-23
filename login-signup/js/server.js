require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Verify environment variables
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env file');
  process.exit(1);
}

// Database connection with better error handling
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Rest of your server code (User model, routes, etc.)
// ... [keep all your existing routes and logic]

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI}`);
});

// User Model
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: { type: String, unique: true },
  password: String,
  role: String,
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  otp: String,
  otpExpires: Date
});
const User = mongoose.model('User', UserSchema);

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Twilio client
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send Email OTP
async function sendEmailOTP(email) {
  const otp = generateOTP();
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP for Verification',
    text: `Your OTP is: ${otp}. It will expire in 10 minutes.`
  };

  await transporter.sendMail(mailOptions);
  return otp;
}

// Send SMS OTP
async function sendSMSOTP(phone) {
  const otp = generateOTP();
  await twilioClient.messages.create({
    body: `Your OTP is: ${otp}. Valid for 10 minutes.`,
    to: phone,
    from: process.env.TWILIO_PHONE_NUMBER
  });
  return otp;
}

// Routes

// Send OTP
app.post('/api/send-otp', async (req, res) => {
  try {
    const { destination, type } = req.body;
    let otp;

    if (type === 'email') {
      // Check if email already exists
      const existingUser = await User.findOne({ email: destination });
      if (existingUser && existingUser.emailVerified) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      otp = await sendEmailOTP(destination);
    } else if (type === 'mobile') {
      // Check if phone already exists
      const existingUser = await User.findOne({ phone: destination });
      if (existingUser && existingUser.phoneVerified) {
        return res.status(400).json({ error: 'Phone number already in use' });
      }
      otp = await sendSMSOTP(destination);
    } else {
      return res.status(400).json({ error: 'Invalid OTP type' });
    }

    // Save OTP to user or create new user if doesn't exist
    const user = await User.findOneAndUpdate(
      type === 'email' ? { email: destination } : { phone: destination },
      {
        [type === 'email' ? 'email' : 'phone']: destination,
        otp,
        otpExpires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { destination, otp, type } = req.body;
    const user = await User.findOne(
      type === 'email' ? { email: destination } : { phone: destination }
    );

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (user.otp !== otp || new Date() > user.otpExpires) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Update verification status
    if (type === 'email') {
      user.emailVerified = true;
    } else {
      user.phoneVerified = true;
    }
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Register User
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Check if both email and phone are verified
    const emailUser = await User.findOne({ email });
    const phoneUser = await User.findOne({ phone });

    if (!emailUser || !emailUser.emailVerified) {
      return res.status(400).json({ error: 'Email not verified' });
    }
    if (!phoneUser || !phoneUser.phoneVerified) {
      return res.status(400).json({ error: 'Phone not verified' });
    }

    // Merge user data (they might be different documents)
    const user = emailUser._id.equals(phoneUser._id) ? emailUser : await User.findByIdAndUpdate(
      emailUser._id,
      {
        $set: {
          phone: phoneUser.phone,
          phoneVerified: true
        }
      },
      { new: true }
    );

    // Check if user is already registered
    if (user.password) {
      return res.status(400).json({ error: 'User already registered' });
    }

    // Hash password and complete registration
    const hashedPassword = await bcrypt.hash(password, 10);
    user.name = name;
    user.password = hashedPassword;
    user.role = role;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ success: true, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login User
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'Please complete registration' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ success: true, token, role: user.role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));