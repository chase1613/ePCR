const express                                         = require('express')
const router                                          = express.Router()
const { login, getMe, changePassword, updateProfile, heartbeat } = require('../controllers/authController')
const { getUsers, createUser, updateUser, toggleUser, getUserNames } = require('../controllers/userController')
const protect                                         = require('../middleware/authMiddleware')
const adminOnly                                       = require('../middleware/adminMiddleware')
const { loginLimiter } = require('../middleware/rateLimiter')

router.post('/login', loginLimiter, login)
router.get('/me',      protect, getMe)
router.patch('/change-password', protect, changePassword)
router.patch('/update-profile', protect, updateProfile)
router.get('/users/names', protect, getUserNames)
router.get('/users',          protect, adminOnly, getUsers)
router.post('/users',         protect, adminOnly, createUser)
router.put('/users/:id',      protect, adminOnly, updateUser)
router.patch('/users/:id/toggle', protect, adminOnly, toggleUser)
router.post('/heartbeat', protect, heartbeat)


module.exports = router