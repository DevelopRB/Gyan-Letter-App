import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { pool, initDatabase } from './backend/db.js'
import recordsRoutes from './backend/routes/records.js'

// Load environment variables
const envResult = dotenv.config()
if (envResult.error) {
  console.warn('Warning: .env file not found or error loading:', envResult.error)
} else {
  console.log('Environment variables loaded from .env')
  console.log('DB_USER:', process.env.DB_USER || 'not set')
  console.log('DB_NAME:', process.env.DB_NAME || 'not set')
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'not set')
}

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
// CORS configuration - allow requests from frontend
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', // Vite default port
  process.env.FRONTEND_URL, // Render frontend URL
].filter(Boolean) // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true)
    } else {
      callback(null, true) // Allow all origins for now - restrict in production if needed
    }
  },
  credentials: true
}))
// Increase body size limit for large Excel imports (50MB)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Routes
app.use('/api/records', recordsRoutes)

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()')
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: result.rows[0].now
    })
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message 
    })
  }
})

// Initialize database on startup
initDatabase()
  .then(() => {
    console.log(`✓ Database connection established`)
    console.log(`✓ Database schema initialized successfully`)
    console.log(`✓ Tables created/verified`)
  })
  .catch((error) => {
    console.error('✗ Failed to initialize database:', error.message)
    console.error('Database operations will fail.')
    console.error('Please check your database connection and environment variables.')
  })

// For Vercel serverless, export the app
// For local development, start the server
if (process.env.VERCEL) {
  // Running on Vercel - export as serverless function
  export default app
} else {
  // Running locally - start the server
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`Initializing database...`)
  })
}

