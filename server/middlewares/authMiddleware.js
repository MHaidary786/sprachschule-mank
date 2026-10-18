const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set. Copy server/.env.example to server/.env and set it.');
}

// Verifies the Bearer token and attaches the decoded payload to req.user.
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token missing' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        return next();
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

// Use after authenticate. Grants access if req.user.role is one of the given roles.
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        return next();
    };
}

module.exports = { authenticate, authorize, JWT_SECRET };
