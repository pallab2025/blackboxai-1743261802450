const express = require('express');
const walletController = require('../controllers/walletController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes
router.use(authController.protect);

router.post('/add', walletController.addToWallet);
router.post('/verify', walletController.verifyWalletPayment);
router.get('/balance', walletController.getWalletBalance);

module.exports = router;