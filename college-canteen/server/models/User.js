const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'super-admin'],
    default: 'student'
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  resetToken: String,
  resetTokenExpires: Date,
  passwordChangedAt: Date
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Set passwordChangedAt when password is modified
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Instance methods
userSchema.methods = {
  comparePassword: async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  },

  createPasswordResetToken: function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.resetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    this.resetTokenExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    return resetToken;
  },

  createVerificationToken: function() {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    this.verificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 1 day
    return verificationToken;
  },

  changedPasswordAfter: function(JWTTimestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
        this.passwordChangedAt.getTime() / 1000,
        10
      );
      return JWTTimestamp < changedTimestamp;
    }
    return false;
  }
};

module.exports = mongoose.model('User', userSchema);