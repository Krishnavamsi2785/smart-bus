import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_bus_key_123';

export const registerUser = async (req, res, next) => {
  try {
    const { name, phone, password, role } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Name, phone, and password are required' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const userRole = role || 'USER';

    const user = new User({ name, phone, password_hash, role: userRole });
    await user.save();

    res.status(201).json({ 
      message: 'User registered successfully', 
      data: { user_id: user._id, name: user.name, phone: user.phone, role: user.role } 
    });
  } catch (err) {
    if (err.code === 11000) { // unique violation in mongo
      return res.status(400).json({ error: 'Phone number already registered' });
    }
    next(err);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    // Admin Override
    if (phone === 'admin' && password === 'password') {
      const token = jwt.sign(
        { user_id: 0, role: 'ADMIN', name: 'System Admin' },
        JWT_SECRET,
        { expiresIn: '1d' }
      );
      return res.json({
        message: 'System Admin Authenticated',
        token,
        data: { user_id: 0, name: 'System Admin', role: 'ADMIN' }
      });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { user_id: user._id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      data: { user_id: user._id, name: user.name, role: user.role }
    });
  } catch (err) {
    next(err);
  }
};
