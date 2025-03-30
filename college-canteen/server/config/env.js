// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = {
  // Server port
  port: process.env.PORT || 5000,

  // MongoDB connection options
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/college-canteen',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    }
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    cookieExpiresIn: process.env.JWT_COOKIE_EXPIRES_IN || 30
  },

  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: process.env.EMAIL_PORT || 2525,
    username: process.env.EMAIL_USERNAME || 'your-mailtrap-username',
    password: process.env.EMAIL_PASSWORD || 'your-mailtrap-password',
    from: process.env.EMAIL_FROM || 'noreply@collegecanteen.com'
  },

  // Razorpay configuration
  razorpay: {
    key_id: process.env.RAZORPAY_KEY_ID || 'your-razorpay-key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'your-razorpay-secret'
  }
};