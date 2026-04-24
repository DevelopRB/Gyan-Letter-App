import express from 'express'
import { pool } from '../db.js'

const router = express.Router()
const INSERT_CHUNK_SIZE = 500
const RESPONSE_PREVIEW_LIMIT = 10

// Helper function to get the next unique ID (GB-01, GB-02, etc.)
async function getNextUniqueId() {
  try {
    // Get all records and find the highest ID
    const result = await pool.query(
      'SELECT data FROM records WHERE data->>\'Unique ID\' IS NOT NULL ORDER BY data->>\'Unique ID\' DESC LIMIT 1'
    )
    
    if (result.rows.length === 0) {
      // No records with IDs yet, start with GB-01
      return 'GB-01'
    }
    
    const lastId = result.rows[0].data['Unique ID']
    if (!lastId || typeof lastId !== 'string' || !lastId.startsWith('GB-')) {
      // If format is wrong, start fresh
      return 'GB-01'
    }
    
    // Extract the number part
    const match = lastId.match(/^GB-(\d+)$/)
    if (!match) {
      return 'GB-01'
    }
    
    const lastNumber = parseInt(match[1], 10)
    const nextNumber = lastNumber + 1
    
    // Format with leading zeros (GB-01, GB-02, ..., GB-99, GB-100, etc.)
    return `GB-${nextNumber.toString().padStart(2, '0')}`
  } catch (error) {
    console.error('Error getting next unique ID:', error)
    // Fallback: use timestamp-based ID
    return `GB-${Date.now().toString().slice(-6)}`
  }
}

// Get all records
router.get('/', async (req, res) => {
  try {
    const { search } = req.query
    let query = 'SELECT id, data, created_at, updated_at FROM records'
    const params = []

    if (search) {
      // Search in JSONB data using PostgreSQL's JSONB operators
      // Prioritize Unique ID field for exact/partial matches
      query += ` WHERE (data->>'Unique ID' ILIKE $1 OR data::text ILIKE $1)`
      params.push(`%${search}%`)
    }

    // Sort by Unique ID if available, otherwise by creation date
    // Extract numeric part from Unique ID for proper numeric sorting
    query += ` ORDER BY 
      CASE 
        WHEN data->>'Unique ID' IS NOT NULL AND data->>'Unique ID' ~ '^GB-\\d+$' 
        THEN CAST(SUBSTRING(data->>'Unique ID' FROM 'GB-(\\d+)') AS INTEGER)
        ELSE 999999
      END ASC,
      created_at DESC`

    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching records:', error)
    res.status(500).json({ error: 'Failed to fetch records' })
  }
})

// Get a single record by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      'SELECT id, data, created_at, updated_at FROM records WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching record:', error)
    res.status(500).json({ error: 'Failed to fetch record' })
  }
})

// Create a new record
router.post('/', async (req, res) => {
  try {
    const { data } = req.body

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid data format' })
    }

    // Generate unique ID if not already present
    const recordData = { ...data }
    if (!recordData['Unique ID'] || recordData['Unique ID'].trim() === '') {
      recordData['Unique ID'] = await getNextUniqueId()
    }

    const result = await pool.query(
      'INSERT INTO records (data) VALUES ($1) RETURNING id, data, created_at, updated_at',
      [JSON.stringify(recordData)]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating record:', error)
    res.status(500).json({ error: 'Failed to create record' })
  }
})

// Bulk create records (for Excel import)
router.post('/bulk', async (req, res) => {
  const startTime = Date.now()
  const { records } = req.body

  console.log('\n=== BULK IMPORT STARTED ===')
  console.log(`📥 Received ${records?.length || 0} records to import`)
  console.log(`⏰ Start time: ${new Date().toISOString()}`)

  try {
    if (!Array.isArray(records) || records.length === 0) {
      console.error('❌ Invalid records format: records must be a non-empty array')
      return res.status(400).json({ error: 'Invalid records format: records must be a non-empty array' })
    }

    // Use a transaction for bulk insert
    const client = await pool.connect()
    try {
      console.log('🔄 Starting database transaction...')
      await client.query('BEGIN')

      const insertedRecordsPreview = []
      const skippedRecords = []
      const totalRecords = records.length
      const logBatchSize = Math.max(100, Math.floor(totalRecords / 10)) // Log every 10% or every 100 records
      let insertedCount = 0

      console.log(`📊 Processing ${totalRecords} records in batches...`)
      console.log(`📦 Insert chunk size: ${INSERT_CHUNK_SIZE} records`)

      // Get starting ID number for bulk import
      let currentIdNumber = 1
      const lastIdResult = await client.query(
        `SELECT data->>'Unique ID' AS unique_id
         FROM records
         WHERE data->>'Unique ID' ~ '^GB-\\d+$'
         ORDER BY CAST(SUBSTRING(data->>'Unique ID' FROM 'GB-(\\d+)') AS INTEGER) DESC
         LIMIT 1`
      )
      if (lastIdResult.rows.length > 0) {
        const lastId = lastIdResult.rows[0].unique_id
        const match = lastId?.match(/^GB-(\d+)$/)
        if (match) {
          currentIdNumber = parseInt(match[1], 10) + 1
        }
      }

      console.log(`🆔 Starting Unique ID generation from: GB-${currentIdNumber.toString().padStart(2, '0')}`)

      const preparedRecords = []

      for (let i = 0; i < records.length; i++) {
        const recordData = { ...records[i] }
        
        // Validate record data
        if (!recordData || typeof recordData !== 'object') {
          skippedRecords.push({ index: i, reason: 'Invalid record format' })
          console.warn(`⚠️  Skipping invalid record at index ${i}`)
          continue
        }

        // Generate unique ID if not already present or if empty/null/whitespace
        const existingUniqueId = recordData['Unique ID']
        const hasValidUniqueId = existingUniqueId && 
                                 typeof existingUniqueId === 'string' && 
                                 existingUniqueId.trim() !== '' &&
                                 existingUniqueId.trim().startsWith('GB-')
        
        if (!hasValidUniqueId) {
          recordData['Unique ID'] = `GB-${currentIdNumber.toString().padStart(2, '0')}`
          currentIdNumber++
        }

        preparedRecords.push({ index: i, data: recordData })
      }

      for (let i = 0; i < preparedRecords.length; i += INSERT_CHUNK_SIZE) {
        const chunk = preparedRecords.slice(i, i + INSERT_CHUNK_SIZE)

        try {
          const valuesClause = chunk
            .map((_, idx) => `($${idx + 1}::jsonb)`)
            .join(', ')
          const params = chunk.map((item) => JSON.stringify(item.data))
          const result = await client.query(
            `INSERT INTO records (data) VALUES ${valuesClause} RETURNING id, data, created_at, updated_at`,
            params
          )

          insertedCount += result.rowCount
          if (insertedRecordsPreview.length < RESPONSE_PREVIEW_LIMIT) {
            const remainingSlots = RESPONSE_PREVIEW_LIMIT - insertedRecordsPreview.length
            insertedRecordsPreview.push(...result.rows.slice(0, remainingSlots))
          }
        } catch (insertError) {
          // Fall back to row-level insert for this chunk so valid rows still import
          for (const item of chunk) {
            try {
              const result = await client.query(
                'INSERT INTO records (data) VALUES ($1) RETURNING id, data, created_at, updated_at',
                [JSON.stringify(item.data)]
              )
              insertedCount += 1
              if (insertedRecordsPreview.length < RESPONSE_PREVIEW_LIMIT) {
                insertedRecordsPreview.push(result.rows[0])
              }
            } catch (rowInsertError) {
              skippedRecords.push({ index: item.index, reason: rowInsertError.message })
            }
          }
        }

        const processed = Math.min(i + INSERT_CHUNK_SIZE, preparedRecords.length)
        if (processed % logBatchSize === 0 || processed === preparedRecords.length) {
          const progress = ((processed / preparedRecords.length) * 100).toFixed(1)
          console.log(`  ✓ Processed ${processed}/${preparedRecords.length} records (${progress}%)`)
        }
      }

      console.log('💾 Committing transaction...')
      await client.query('COMMIT')
      
      const endTime = Date.now()
      const duration = ((endTime - startTime) / 1000).toFixed(2)
      
      console.log('\n=== BULK IMPORT COMPLETED ===')
      console.log(`✅ Successfully imported: ${insertedCount} records`)
      console.log(`⚠️  Skipped: ${skippedRecords.length} records`)
      console.log(`⏱️  Total time: ${duration} seconds`)
      const durationInSeconds = Math.max((endTime - startTime) / 1000, 0.001)
      console.log(`📈 Average: ${(insertedCount / durationInSeconds).toFixed(2)} records/second`)
      console.log(`⏰ End time: ${new Date().toISOString()}`)
      
      if (skippedRecords.length > 0) {
        console.log(`\n⚠️  Skipped records details:`)
        skippedRecords.slice(0, 10).forEach(skip => {
          console.log(`   - Index ${skip.index}: ${skip.reason}`)
        })
        if (skippedRecords.length > 10) {
          console.log(`   ... and ${skippedRecords.length - 10} more`)
        }
      }
      console.log('================================\n')

      res.status(201).json({ 
        message: `Successfully imported ${insertedCount} records`,
        count: insertedCount,
        skipped: skippedRecords.length,
        duration: `${duration}s`,
        recordsPerSecond: parseFloat((insertedCount / durationInSeconds).toFixed(2)),
        records: insertedRecordsPreview
      })
    } catch (error) {
      await client.query('ROLLBACK')
      const endTime = Date.now()
      const duration = ((endTime - startTime) / 1000).toFixed(2)
      console.error('\n❌ BULK IMPORT FAILED')
      console.error(`⏱️  Failed after: ${duration} seconds`)
      console.error(`💥 Database error:`, error.message)
      console.error('================================\n')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)
    console.error('\n❌ BULK IMPORT ERROR')
    console.error(`⏱️  Error after: ${duration} seconds`)
    console.error(`💥 Error:`, error.message)
    console.error('================================\n')
    
    res.status(500).json({ 
      error: 'Failed to bulk create records',
      details: error.message,
      duration: `${duration}s`
    })
  }
})

// Update a record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { data } = req.body

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid data format' })
    }

    const result = await pool.query(
      'UPDATE records SET data = $1 WHERE id = $2 RETURNING id, data, created_at, updated_at',
      [JSON.stringify(data), id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating record:', error)
    res.status(500).json({ error: 'Failed to update record' })
  }
})

// Delete a record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      'DELETE FROM records WHERE id = $1 RETURNING id',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' })
    }

    res.json({ message: 'Record deleted successfully', id: parseInt(id) })
  } catch (error) {
    console.error('Error deleting record:', error)
    res.status(500).json({ error: 'Failed to delete record' })
  }
})

// Delete all records
router.delete('/', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM records RETURNING id')
    res.json({ 
      message: 'All records deleted successfully',
      count: result.rows.length
    })
  } catch (error) {
    console.error('Error deleting all records:', error)
    res.status(500).json({ error: 'Failed to delete all records' })
  }
})

export default router

