import pkg from 'pg'
const { Pool } = pkg
import dotenv from 'dotenv'

dotenv.config()

// PostgreSQL connection pool
export const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'gyan_letter_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
  // SSL configuration for cloud databases (Neon, Supabase, etc.)
  ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? {
    rejectUnauthorized: false
  } : false
})

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database')
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

// Initialize database schema
export async function initDatabase() {
  try {
    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create index on username for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
    `)

    // Create records table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS records (
        id SERIAL PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create categories table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL DEFAULT 'custom',
        items JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create index on JSONB data for better query performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_records_data_gin ON records USING GIN (data)
    `)

    // Create index on category type for faster filtering
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type)
    `)

    // Create function to update updated_at timestamp
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `)

    // Create trigger to auto-update updated_at for users
    await pool.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `)

    // Create trigger to auto-update updated_at for records
    await pool.query(`
      DROP TRIGGER IF EXISTS update_records_updated_at ON records;
      CREATE TRIGGER update_records_updated_at
      BEFORE UPDATE ON records
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `)

    // Create trigger to auto-update updated_at for categories
    await pool.query(`
      DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
      CREATE TRIGGER update_categories_updated_at
      BEFORE UPDATE ON categories
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `)

    // Ensure commonly used legacy custom categories exist after deployment.
    // This keeps historical data aligned for users who previously relied on local-only categories.
    const requiredCustomCategories = [
      { id: 'custom_colleges', name: 'Colleges' },
      { id: 'custom_libraries', name: 'Libraries' },
      { id: 'custom_institutes', name: 'Institutes' },
    ]

    for (const category of requiredCustomCategories) {
      await pool.query(
        `
        INSERT INTO categories (id, name, type, items)
        SELECT $1::varchar, $2::varchar, 'custom', '[]'::jsonb
        WHERE NOT EXISTS (
          SELECT 1 FROM categories WHERE LOWER(name) = LOWER($2::varchar)
        )
        `,
        [category.id, category.name]
      )
    }

    // Backfill legacy records so existing uploaded data points to the synchronized categories.
    // Handles common name variations and typo "Librarires".
    const recordCategoryMappings = [
      {
        id: 'custom_libraries',
        name: 'Libraries',
        aliases: ['libraries', 'librarires', 'library'],
      },
      {
        id: 'custom_institutes',
        name: 'Institutes',
        aliases: ['institutes', 'institute'],
      },
      {
        id: 'custom_colleges',
        name: 'Colleges',
        aliases: ['colleges', 'college'],
      },
    ]

    for (const mapping of recordCategoryMappings) {
      await pool.query(
        `
        UPDATE records
        SET data = jsonb_set(
          jsonb_set(data, '{_categoryId}', to_jsonb($1::text), true),
          '{_categoryName}',
          to_jsonb($2::text),
          true
        )
        WHERE LOWER(COALESCE(data->>'_categoryName', '')) = ANY($3::text[])
        `,
        [mapping.id, mapping.name, mapping.aliases]
      )
    }

    console.log('Database schema initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}


