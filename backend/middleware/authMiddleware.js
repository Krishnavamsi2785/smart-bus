import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_bus_key_123';

export const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { user_id, role, name }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token is invalid or expired' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Admin privileges required' });
  }
};

export const conductorOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'CONDUCTOR' || req.user.role === 'ADMIN')) {
    next();
  } else {
    res.status(403).json({ error: 'Conductor privileges required' });
  }
};
