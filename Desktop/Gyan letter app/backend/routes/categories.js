import express from 'express'
import { pool } from '../db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

const DEFAULT_CATEGORIES = {
  default: { name: 'Default', type: 'default', items: [] },
  states: { name: 'Indian States', type: 'states', items: [] },
  universities: { name: 'Universities', type: 'universities', items: [] },
  emails: { name: 'Complete Mails', type: 'emails', items: [] }
}

const PROTECTED_DEFAULT_IDS = ['default', 'states', 'universities', 'emails']
const CANONICAL_CUSTOM_CATEGORIES = {
  colleges: { id: 'custom_colleges', name: 'Colleges' },
  libraries: { id: 'custom_libraries', name: 'Libraries' },
  institute: { id: 'custom_institute', name: 'Institute' },
}

const CACHE_TTL_MS = 5 * 60 * 1000
let categoriesCache = null
let categoriesCacheAt = 0

const rowsToCategoryMap = (rows) => {
  const categories = {}
  rows.forEach((row) => {
    categories[row.id] = {
      name: row.name,
      type: row.type,
      items: Array.isArray(row.items) ? row.items : [],
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    }
  })
  return categories
}

const invalidateCategoriesCache = () => {
  categoriesCache = null
  categoriesCacheAt = 0
}

const loadCategoriesFromDb = async () => {
  const result = await pool.query(
    'SELECT id, name, type, items, created_at, updated_at FROM categories ORDER BY created_at ASC'
  )
  return rowsToCategoryMap(result.rows)
}

const getCachedCategories = async () => {
  const now = Date.now()
  if (categoriesCache && now - categoriesCacheAt < CACHE_TTL_MS) {
    return categoriesCache
  }
  categoriesCache = await loadCategoriesFromDb()
  categoriesCacheAt = now
  return categoriesCache
}

const ensureDefaultCategories = async () => {
  for (const [id, category] of Object.entries(DEFAULT_CATEGORIES)) {
    await pool.query(
      `
      INSERT INTO categories (id, name, type, items)
      VALUES ($1, $2, $3, $4::jsonb)
      ON CONFLICT (id) DO NOTHING
      `,
      [id, category.name, category.type, JSON.stringify(category.items)]
    )
  }
}

const normalizeCustomCategory = (rawName, rawId) => {
  const normalizedName = String(rawName || '').trim().toLowerCase()
  const normalizedId = String(rawId || '').trim().toLowerCase()
  const value = `${normalizedName} ${normalizedId}`

  if (value.includes('librari') || value.includes('librar')) {
    return CANONICAL_CUSTOM_CATEGORIES.libraries
  }
  if (value.includes('institu') || value.includes('institue')) {
    return CANONICAL_CUSTOM_CATEGORIES.institute
  }
  if (value.includes('colleg') || value.includes('collag')) {
    return CANONICAL_CUSTOM_CATEGORIES.colleges
  }

  if (!normalizedName) {
    return null
  }
  const generatedId = normalizedId && normalizedId.startsWith('custom_')
    ? normalizedId
    : `custom_${normalizedName.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`
  return { id: generatedId || `custom_${Date.now()}`, name: String(rawName).trim() }
}

const ensureCategoriesFromExistingRecords = async () => {
  const recordsResult = await pool.query(`
    SELECT DISTINCT data->>'_categoryId' AS category_id, data->>'_categoryName' AS category_name
    FROM records
    WHERE data ? '_categoryName'
      AND COALESCE(data->>'_categoryName', '') <> ''
  `)

  for (const row of recordsResult.rows) {
    const category = normalizeCustomCategory(row.category_name, row.category_id)
    if (!category) continue
    if (PROTECTED_DEFAULT_IDS.includes(category.id)) continue

    await pool.query(
      `
      INSERT INTO categories (id, name, type, items)
      SELECT $1::varchar, $2::varchar, 'custom', '[]'::jsonb
      WHERE NOT EXISTS (
        SELECT 1 FROM categories WHERE id = $1::varchar OR LOWER(name) = LOWER($2::varchar)
      )
      `,
      [category.id, category.name]
    )
  }
}

// Run once at startup (not on every GET) to keep memory/cpu low on 512MB instances.
export async function syncCategoriesOnce() {
  await ensureDefaultCategories()

  const customCountResult = await pool.query(`
    SELECT COUNT(*)::int AS count
    FROM categories
    WHERE id NOT IN ('default', 'states', 'universities', 'emails')
  `)
  const customCount = customCountResult.rows[0]?.count ?? 0

  if (customCount === 0) {
    await ensureCategoriesFromExistingRecords()
  }

  invalidateCategoriesCache()
}

router.use(authenticateToken)

router.get('/', async (req, res) => {
  try {
    const categoriesMap = await getCachedCategories()
    return res.json(categoriesMap)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, type = 'custom' } = req.body
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Category name is required' })
    }

    const newId = `custom_${Date.now()}`
    const trimmedName = String(name).trim()
    const result = await pool.query(
      `
      INSERT INTO categories (id, name, type, items)
      VALUES ($1, $2, $3, '[]'::jsonb)
      RETURNING id, name, type, items, created_at, updated_at
      `,
      [newId, trimmedName, type]
    )

    invalidateCategoriesCache()

    const created = result.rows[0]
    return res.status(201).json({
      id: created.id,
      category: {
        name: created.name,
        type: created.type,
        items: Array.isArray(created.items) ? created.items : [],
        createdAt: new Date(created.created_at).toISOString(),
        updatedAt: created.updated_at ? new Date(created.updated_at).toISOString() : undefined,
      },
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return res.status(500).json({ error: 'Failed to create category' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Category name is required' })
    }

    const result = await pool.query(
      `
      UPDATE categories
      SET name = $1
      WHERE id = $2
      RETURNING id
      `,
      [String(name).trim(), id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Category not found' })
    }

    invalidateCategoriesCache()
    return res.json({ success: true })
  } catch (error) {
    console.error('Error renaming category:', error)
    return res.status(500).json({ error: 'Failed to rename category' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (PROTECTED_DEFAULT_IDS.includes(id)) {
      return res.status(400).json({ error: 'Cannot delete default category' })
    }

    const result = await pool.query('DELETE FROM categories WHERE id = $1', [id])
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Category not found' })
    }

    invalidateCategoriesCache()
    return res.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return res.status(500).json({ error: 'Failed to delete category' })
  }
})

export default router
