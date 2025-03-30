const Booking = require('../models/Booking');
const Meal = require('../models/Meal');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { createOrder, verifySignature, initiateRefund } = require('../utils/razorpay');

// Create a new booking
exports.createBooking = catchAsync(async (req, res, next) => {
  const { mealId, quantity, paymentMethod } = req.body;
  
  // 1) Get the meal and verify availability
  const meal = await Meal.findById(mealId);
  if (!meal || !meal.available) {
    return next(new AppError('Meal not available for booking', 400));
  }

  // 2) Check if user has sufficient wallet balance for wallet payments
  if (paymentMethod === 'wallet' && req.user.walletBalance < (meal.price * quantity)) {
    return next(new AppError('Insufficient wallet balance', 400));
  }

  // 3) Create booking
  const booking = await Booking.create({
    user: req.user._id,
    meal: mealId,
    quantity,
    paymentMethod
  });

  // 4) Handle payment based on method
  if (paymentMethod === 'wallet') {
    // Deduct from wallet
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { walletBalance: -(meal.price * quantity) }
    });
    booking.paymentStatus = 'paid';
    booking.status = 'confirmed';
    await booking.save();
  } else if (paymentMethod === 'razorpay') {
    // Create Razorpay order
    try {
      const order = await createOrder(
        meal.price * quantity,
        `booking_${booking._id}`
      );
      booking.razorpayOrderId = order.id;
      await booking.save();
      
      return res.status(200).json({
        status: 'success',
        data: {
          booking,
          paymentOrder: order
        }
      });
    } catch (err) {
      await Booking.findByIdAndDelete(booking._id);
      return next(new AppError('Payment processing failed', 400));
    }
  }

  // 5) Update meal stats
  await Meal.findByIdAndUpdate(mealId, {
    $inc: { soldToday: quantity }
  });

  res.status(201).json({
    status: 'success',
    data: {
      booking
    }
  });
});

// Get all bookings for a user
exports.getUserBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user._id })
    .sort('-createdAt')
    .populate('meal');

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: {
      bookings
    }
  });
});

// Cancel a booking
exports.cancelBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!booking) {
    return next(new AppError('No booking found with that ID', 404));
  }

  // Can only cancel pending or confirmed bookings
  if (!['pending', 'confirmed'].includes(booking.status)) {
    return next(new AppError('This booking cannot be cancelled', 400));
  }

  // Refund if payment was made
  if (booking.paymentStatus === 'paid') {
    if (booking.paymentMethod === 'wallet') {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { walletBalance: booking.totalPrice }
      });
    } else if (booking.paymentMethod === 'razorpay') {
      try {
        await initiateRefund(
          booking.razorpayPaymentId, 
          booking.totalPrice
        );
      } catch (err) {
        console.error('Refund failed:', err);
        // Log the error but don't fail the cancellation
      }
    }
    booking.paymentStatus = 'refunded';
  }

  booking.status = 'cancelled';
  await booking.save();

  res.status(200).json({
    status: 'success',
    data: {
      booking
    }
  });
});

// Get booking stats for admin dashboard
exports.getStats = catchAsync(async (req, res, next) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalBookings, todayBookings] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ createdAt: { $gte: todayStart } })
  ]);

  const [totalRevenue, todayRevenue] = await Promise.all([
    Booking.aggregate([
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]),
    Booking.aggregate([
      { $match: { createdAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ])
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      totalBookings,
      todayBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0
    }
  });
});

// Get recent bookings for admin dashboard
exports.getRecentBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find()
    .sort('-createdAt')
    .limit(5)
    .populate('user', 'name')
    .populate('meal', 'name');

  res.status(200).json({
    status: 'success',
    data: bookings
  });
});

// Verify Razorpay payment
exports.verifyPayment = catchAsync(async (req, res, next) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
  
  // Verify payment signature
  if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return next(new AppError('Payment verification failed', 400));
  }

  // Update booking status
  const booking = await Booking.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id },
    {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentStatus: 'paid',
      status: 'confirmed'
    },
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    data: {
      booking
    }
  });
});