const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { chatWithAssistant } = require('../controllers/aiController');

router.post('/chat', authMiddleware, chatWithAssistant);

module.exports = router;
