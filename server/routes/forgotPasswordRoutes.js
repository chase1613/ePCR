const express  = require('express')
const router   = express.Router()
const {
  sendOTP, verifyOTP, resetPassword
} = require('../controllers/forgotPasswordController')
const {
  forgotPasswordLimiter,
  otpVerifyLimiter,
} = require('../middleware/rateLimiter')

router.post('/send-otp',       forgotPasswordLimiter, sendOTP)
router.post('/verify-otp',     otpVerifyLimiter,      verifyOTP)
router.post('/reset-password', forgotPasswordLimiter, resetPassword)

module.exports = router