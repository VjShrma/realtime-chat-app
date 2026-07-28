const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');

//Protected route - only accessible with a valid JWT 
router.get('/me', verifyToken, (req, res) => {
    res.json({
        message: 'Token verified ✅',
        user: req.user,
    });
});

module.exports = router;