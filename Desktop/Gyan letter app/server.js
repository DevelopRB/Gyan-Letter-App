import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import XLSX from 'xlsx'
import { pool, initDatabase } from './backend/db.js'
import recordsRoutes from './backend/routes/records.js'
import authRoutes from './backend/routes/auth.js'
import categoriesRoutes from './backend/routes/categories.js'

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
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Middleware
// CORS configuration - allow requests from frontend
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', // Vite default port
  'https://gyan-letter-app-1.onrender.com', // Render frontend URL
  process.env.FRONTEND_URL, // Additional frontend URL from env
].filter(Boolean) // Remove undefined values

console.log('CORS allowed origins:', allowedOrigins)

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('[CORS] Request with no origin, allowing')
      return callback(null, true)
    }
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('[CORS] Allowing origin:', origin)
      callback(null, true)
    } else if (process.env.NODE_ENV !== 'production') {
      console.log('[CORS] Development mode, allowing origin:', origin)
      callback(null, true)
    } else {
      // In production, allow all for now but log it
      console.log('[CORS] Production mode, allowing origin:', origin)
      callback(null, true)
    }
  },
  credentials: true
}))
// Increase body size limit for large Excel imports (50MB)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/records', recordsRoutes)
app.use('/api/categories', categoriesRoutes)

const CRM_TEMPLATE_FILE_PATH =
  process.env.CRM_TEMPLATE_PATH || 'C:\\Users\\abhis\\Downloads\\CRM template.xlsx'
const CRM_TEMPLATE_HEADERS = [
  'Unique ID',
  'Name',
  'Department',
  'Current Role',
  'Employee Type',
  'Current Company',
  'Past Experience',
  'Date of Joining',
  'Total Experience',
  'Experience (Years)',
  'Designation',
  'Designation-Category',
  'Highest Qualification',
  'Qualified From',
  'Certifications',
  'Official Email',
  'Personal Email',
  'Mobile',
  'WhatsApp',
  'Office Extension',
  'Office Address',
  'Profile Link',
  'Google Scholar',
  'ResearchGate',
  'LinkedIn',
  'ORCID',
  'Committees',
  'Additional Roles',
  'ID Proof',
  'Certificates',
  'Status',
  'File Name',
]

// Download CRM template as Excel file
app.get('/api/template-download', (req, res) => {
  try {
    if (!fs.existsSync(CRM_TEMPLATE_FILE_PATH)) {
      console.warn('CRM template file not found. Falling back to generated XLSX:', CRM_TEMPLATE_FILE_PATH)
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.aoa_to_sheet([CRM_TEMPLATE_HEADERS])
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Template')
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', 'attachment; filename="CRM template.xlsx"')
      return res.status(200).send(excelBuffer)
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    return res.download(CRM_TEMPLATE_FILE_PATH, 'CRM template.xlsx')
  } catch (error) {
    console.error('Template download generation failed:', error)
    return res.status(500).json({ error: 'Failed to download template file' })
  }
})

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

// Serve built frontend (single-service deployment on Render)
const distPath = path.join(__dirname, 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next()
    }
    return res.sendFile(path.join(distPath, 'index.html'))
  })
} else {
  app.get('/', (req, res) => {
    res.status(200).send('API is running. Build frontend to serve the web app from this service.')
  })
}

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

// Start the server for Render and local development
// On Render, process.env.PORT is automatically set
// On Vercel, this file won't be executed (serverless functions are used instead)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`Initializing database...`)
  })
}

