const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { createOrder } = require('../utils/razorpay');

// Add money to wallet
exports.addToWallet = catchAsync(async (req, res, next) => {
  const { amount } = req.body;
  
  if (amount <= 0) {
    return next(new AppError('Amount must be greater than 0', 400));
  }

  // Create Razorpay order
  try {
    const order = await createOrder(
      amount,
      `wallet_${req.user._id}_${Date.now()}`
    );

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (err) {
    return next(new AppError('Failed to create payment order', 500));
  }
});

// Verify wallet top-up payment
exports.verifyWalletPayment = catchAsync(async (req, res, next) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount } = req.body;

  // Verify payment signature
  const { verifySignature } = require('../utils/razorpay');
  if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return next(new AppError('Payment verification failed', 400));
  }

  // Update user's wallet balance
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { walletBalance: amount }
  });

  res.status(200).json({
    status: 'success',
    message: 'Wallet top-up successful'
  });
});

// Get wallet balance
exports.getWalletBalance = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('walletBalance');
  
  res.status(200).json({
    status: 'success',
    data: {
      balance: user.walletBalance
    }
  });
});