const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  console.log('Auth header received:', authHeader);

  if (!authHeader) {
    return res.status(401).json({ message: 'No auth header at all' });
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Does not start with Bearer' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('JWT error:', error.message);
    return res.status(401).json({ message: error.message });
  }
};

module.exports = verifyToken;