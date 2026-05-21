const express    = require('express')
const cors       = require('cors')
require('dotenv').config({ path: __dirname + '/.env' }) 

const authRoutes = require('./routes/authRoutes')

const app = express()

const pcrRoutes = require('./routes/pcr');
const pillarRoutes = require('./routes/pillarRoutes')
const forgotPasswordRoutes = require('./routes/forgotPasswordRoutes')


// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',  // dev
    'http://localhost:4173',  // preview
  ],
  credentials: true,
}))

app.use(express.json())
app.use('/api/pcr', pcrRoutes);
app.use(express.urlencoded({ extended: true }))
app.use('/api/pillars', pillarRoutes)
app.use('/api/forgot-password', forgotPasswordRoutes)

// Routes
app.use('/api/auth', authRoutes)

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'ePCR API is running ✅' })
})

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something went wrong.' })
})

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})


