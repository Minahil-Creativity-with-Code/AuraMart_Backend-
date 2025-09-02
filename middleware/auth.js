const jwt = require('jsonwebtoken'); //jwt library
const User = require('../models/User'); //userSchema 

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';  //from env 

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {    //an async middleware function called authenticateToken.
  try {                                                  //Middleware functions in Express take (req, res, next) arguments.
    const authHeader = req.headers['authorization'];   //Gets the Authorization header from the incoming HTTP request.
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
 
    if (!token) {                                              // If no token is found, return a 401 Unauthorized response.
      return res.status(401).json({ error: 'Access token required' });
    }
    //Verifies the JWT using the secret key. If valid, returns the decoded payload ,If invalid, throws an error
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if the token has the correct structure
    if (!decoded.userId) {
      return res.status(401).json({ error: 'Invalid token structure' });
    }

    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Middleware to check if user is verified
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!req.user.isEmailVerified) {
    return res.status(403).json({ error: 'Email verification required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireEmailVerification
}; 