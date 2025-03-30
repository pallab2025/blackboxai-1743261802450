const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  meal: {
    type: mongoose.Schema.ObjectId,
    ref: 'Meal',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['wallet', 'razorpay', 'cash'],
    default: 'wallet'
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
bookingSchema.index({ user: 1 });
bookingSchema.index({ date: 1 });
bookingSchema.index({ status: 1 });

// Virtual populate
bookingSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'booking',
  localField: '_id'
});

// Pre-save hook to calculate total price
bookingSchema.pre('save', async function(next) {
  if (this.isModified('quantity') || this.isNew) {
    const meal = await mongoose.model('Meal').findById(this.meal);
    this.totalPrice = this.quantity * meal.price;
  }
  next();
});

// Query middleware to populate user and meal details
bookingSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name email'
  }).populate({
    path: 'meal',
    select: 'name price image'
  });
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);