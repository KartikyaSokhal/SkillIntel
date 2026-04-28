const express = require('express');
const router = express.Router();
const { renderDashboard, renderLogin } = require('../controllers/dashboardController');
const sessionCheck = require('../middleware/sessionCheck');
router.get('/login', renderLogin);
router.get('/dashboard', sessionCheck, renderDashboard);
module.exports = router;
