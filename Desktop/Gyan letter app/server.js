import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { pool, initDatabase } from './backend/db.js'
import recordsRoutes from './backend/routes/records.js'
import authRoutes from './backend/routes/auth.js'

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

const CRM_TEMPLATE_HEADERS = [
  'Main Category',
  'Ownership Type',
  'Management Type',
  'Subcategory',
  'Sub category 1',
  'Sub category 2',
  'Sub category 3',
  'Sub category 4',
  'Specialization',
  'Organization Name',
  'University',
  'University Code / Short Code',
  'Address-1',
  'Adddress-2',
  'Address-3',
  'Landmark',
  'City / Campus',
  'District',
  'State / UT',
  'Postal Code',
  'Country',
  'Google Map Link',
  'GeoCoordinates',
  'Year Established',
  'Accreditation',
  'Approval',
  'Website',
  'Contact Email-1',
  'Contact Email-2',
  'Contact Phone-1',
  'Contact Phone-2',
  'Contact Mobile',
  'Contact Whatsapp',
  'Contact Fax-2',
  'Affiliated Colleges',
  'Mode',
  'Notes',
  'Faculty ID',
  'honorific',
  'Full Name',
  'Gender',
  'Department',
  'Office Address (Room, Block, Floor)',
  'School / Division',
  'Subjects Taught',
  'Specialization',
  'Research Area',
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
  'File Name'
]

// Download CRM template as generated CSV (Render-safe)
app.get('/api/template-download', (req, res) => {
  try {
    const escapedHeaders = CRM_TEMPLATE_HEADERS.map((header) => `"${String(header).replace(/"/g, '""')}"`)
    const csvContent = `${escapedHeaders.join(',')}\n`

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="CRM template.csv"')
    return res.send(csvContent)
  } catch (error) {
    console.error('Template download generation failed:', error)
    return res.status(500).json({ error: 'Failed to generate template file' })
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

