// Setup script to help configure the application
import fs from 'fs'
import { execSync } from 'child_process'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function setup() {
  console.log('=== Gyan Letter App Setup ===\n')

  // Check if .env exists
  if (fs.existsSync('.env')) {
    console.log('✓ .env file already exists\n')
    const overwrite = await question('Do you want to update it? (y/n): ')
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.')
      rl.close()
      return
    }
  }

  console.log('Please provide your PostgreSQL configuration:\n')

  const dbUser = await question('Database User [postgres]: ') || 'postgres'
  const dbHost = await question('Database Host [localhost]: ') || 'localhost'
  const dbName = await question('Database Name [gyan_letter_db]: ') || 'gyan_letter_db'
  const dbPassword = await question('Database Password: ')
  const dbPort = await question('Database Port [5432]: ') || '5432'
  const serverPort = await question('Server Port [5000]: ') || '5000'

  const envContent = `# Database Configuration
DB_USER=${dbUser}
DB_HOST=${dbHost}
DB_NAME=${dbName}
DB_PASSWORD=${dbPassword}
DB_PORT=${dbPort}

# Server Configuration
PORT=${serverPort}
`

  fs.writeFileSync('.env', envContent)
  console.log('\n✓ .env file created successfully!\n')

  console.log('Next steps:')
  console.log('1. Make sure PostgreSQL is running')
  console.log('2. Create the database:')
  console.log(`   psql -U ${dbUser} -c "CREATE DATABASE ${dbName};"`)
  console.log('3. Start the backend: npm run server')
  console.log('4. Start the frontend: npm run dev\n')

  rl.close()
}

setup().catch(console.error)















