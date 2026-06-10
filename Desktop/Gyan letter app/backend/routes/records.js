import express from 'express'
import { pool } from '../db.js'

const router = express.Router()
const INSERT_CHUNK_SIZE = 500
const RESPONSE_PREVIEW_LIMIT = 10
const UPDATE_CHUNK_SIZE = 500

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
    const { search, categoryId } = req.query
    const parsedPage = parseInt(req.query.page, 10)
    const parsedLimit = parseInt(req.query.limit, 10)
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 500) : 100
    const offset = (page - 1) * limit
    const conditions = []
    const params = []

    if (search) {
      params.push(`%${search}%`)
      conditions.push(`(data->>'Unique ID' ILIKE $${params.length} OR data::text ILIKE $${params.length})`)
    }

    if (categoryId) {
      if (categoryId === '_uncategorized') {
        conditions.push(`(data->>'_categoryId' IS NULL OR TRIM(COALESCE(data->>'_categoryId', '')) = '')`)
      } else {
        params.push(categoryId)
        conditions.push(`data->>'_categoryId' = $${params.length}`)
      }
    }

    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''
    const countQuery = `SELECT COUNT(*)::int AS total FROM records${whereClause}`
    const countResult = await pool.query(countQuery, params)
    const total = countResult.rows[0]?.total ?? 0
    const totalPages = Math.max(1, Math.ceil(total / limit))

    const dataParams = [...params]
    dataParams.push(limit)
    const limitParam = `$${dataParams.length}`
    dataParams.push(offset)
    const offsetParam = `$${dataParams.length}`

    const dataQuery = `SELECT id, data, created_at, updated_at FROM records${whereClause}
      ORDER BY
        CASE
          WHEN data->>'Unique ID' IS NOT NULL AND data->>'Unique ID' ~ '^GB-\\d+$'
          THEN CAST(SUBSTRING(data->>'Unique ID' FROM 'GB-(\\d+)') AS INTEGER)
          ELSE 999999
        END ASC,
        created_at DESC
      LIMIT ${limitParam}
      OFFSET ${offsetParam}`

    const result = await pool.query(dataQuery, dataParams)
    res.json({
      records: result.rows,
      total,
      page,
      limit,
      totalPages
    })
  } catch (error) {
    console.error('Error fetching records:', error)
    res.status(500).json({ error: 'Failed to fetch records' })
  }
})

// Aggregated stats for the overview dashboard (no full-record load)
router.get('/stats', async (req, res) => {
  try {
    const [totalsResult, categoryResult, itemsResult] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (
            WHERE data->>'_categoryId' IS NULL
               OR TRIM(COALESCE(data->>'_categoryId', '')) = ''
          )::int AS uncategorized
        FROM records
      `),
      pool.query(`
        SELECT
          data->>'_categoryId' AS category_id,
          MAX(data->>'_categoryName') AS category_name,
          COUNT(*)::int AS count
        FROM records
        WHERE data->>'_categoryId' IS NOT NULL
          AND TRIM(COALESCE(data->>'_categoryId', '')) <> ''
        GROUP BY data->>'_categoryId'
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT
          data->>'_categoryId' AS category_id,
          data->>'_selectedItem' AS item,
          COUNT(*)::int AS count
        FROM records
        WHERE data->>'_categoryId' IS NOT NULL
          AND TRIM(COALESCE(data->>'_categoryId', '')) <> ''
          AND data->>'_selectedItem' IS NOT NULL
          AND TRIM(data->>'_selectedItem') <> ''
        GROUP BY data->>'_categoryId', data->>'_selectedItem'
        ORDER BY category_id, count DESC
      `)
    ])

    const itemsByCategory = {}
    for (const row of itemsResult.rows) {
      if (!itemsByCategory[row.category_id]) {
        itemsByCategory[row.category_id] = {}
      }
      itemsByCategory[row.category_id][row.item] = row.count
    }

    res.json({
      total: totalsResult.rows[0]?.total ?? 0,
      uncategorized: totalsResult.rows[0]?.uncategorized ?? 0,
      byCategory: categoryResult.rows.map((row) => ({
        categoryId: row.category_id,
        categoryName: row.category_name || 'Unknown Category',
        count: row.count
      })),
      itemsByCategory
    })
  } catch (error) {
    console.error('Error fetching record stats:', error)
    res.status(500).json({ error: 'Failed to fetch record stats' })
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
  const payloadBytes = Number(req.headers['content-length'] || 0)
  if (payloadBytes > 0) {
    console.log(`📦 Request payload size: ${(payloadBytes / (1024 * 1024)).toFixed(2)} MB`)
  }
  if (Array.isArray(records) && records.length > 0) {
    const importChunkCount = Math.ceil(records.length / INSERT_CHUNK_SIZE)
    console.log(`🧩 Estimated chunk count: ${importChunkCount}`)
  }
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

// Bulk update records by Unique ID (for Excel custom updates)
router.post('/bulk-update', async (req, res) => {
  const startTime = Date.now()
  const { records } = req.body

  try {
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Invalid records format: records must be a non-empty array' })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      let updatedCount = 0
      const updatedRecordsPreview = []
      const skippedRecords = []
      const notFoundRecords = []

      for (let i = 0; i < records.length; i += UPDATE_CHUNK_SIZE) {
        const chunk = records.slice(i, i + UPDATE_CHUNK_SIZE)

        for (let j = 0; j < chunk.length; j++) {
          const item = chunk[j]
          const index = i + j

          if (!item || typeof item !== 'object') {
            skippedRecords.push({ index, reason: 'Invalid record format' })
            continue
          }

          const uniqueId = String(item['Unique ID'] || '').trim()
          if (!uniqueId) {
            skippedRecords.push({ index, reason: 'Missing Unique ID' })
            continue
          }

          const { ['Unique ID']: _, ...incomingFields } = item
          if (Object.keys(incomingFields).length === 0) {
            skippedRecords.push({ index, uniqueId, reason: 'No fields provided to update' })
            continue
          }

          const existingResult = await client.query(
            `SELECT id, data
             FROM records
             WHERE data->>'Unique ID' = $1
             LIMIT 1`,
            [uniqueId]
          )

          if (existingResult.rows.length === 0) {
            notFoundRecords.push({ index, uniqueId })
            continue
          }

          const existing = existingResult.rows[0]
          const mergedCategoryId = String(incomingFields._categoryId ?? existing.data._categoryId ?? '').trim()
          const mergedCategoryName = String(incomingFields._categoryName ?? existing.data._categoryName ?? '').trim()

          if (!mergedCategoryId || !mergedCategoryName) {
            skippedRecords.push({
              index,
              uniqueId,
              reason: 'Missing category id or category name'
            })
            continue
          }

          const mergedData = {
            ...existing.data,
            ...incomingFields,
            _categoryId: mergedCategoryId,
            _categoryName: mergedCategoryName,
            'Unique ID': uniqueId
          }

          const updatedResult = await client.query(
            'UPDATE records SET data = $1 WHERE id = $2 RETURNING id, data, created_at, updated_at',
            [JSON.stringify(mergedData), existing.id]
          )

          if (updatedResult.rows.length > 0) {
            updatedCount += 1
            if (updatedRecordsPreview.length < RESPONSE_PREVIEW_LIMIT) {
              updatedRecordsPreview.push(updatedResult.rows[0])
            }
          }
        }
      }

      await client.query('COMMIT')

      const durationInSeconds = Math.max((Date.now() - startTime) / 1000, 0.001)
      res.json({
        message: `Successfully updated ${updatedCount} records`,
        count: updatedCount,
        skipped: skippedRecords.length,
        notFound: notFoundRecords.length,
        skippedDetails: skippedRecords.slice(0, 20),
        notFoundDetails: notFoundRecords.slice(0, 20),
        recordsPerSecond: parseFloat((updatedCount / durationInSeconds).toFixed(2)),
        records: updatedRecordsPreview
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error bulk updating records:', error)
    res.status(500).json({
      error: 'Failed to bulk update records',
      details: error.message
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

