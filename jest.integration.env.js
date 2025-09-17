// Load environment variables from .env.local
const path = require('path')
const fs = require('fs')

// Load .env.local file if it exists
const envLocalPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim()
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '') // Remove quotes
        process.env[key.trim()] = value
      }
    }
  })
  console.log('✅ Loaded environment variables from .env.local')
} else {
  console.log('⚠️  .env.local file not found, using default test values')
  // Fallback to test values
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/wispaper_test?schema=public'
  process.env.NEXTAUTH_SECRET = 'test-secret-key'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
  process.env.DISABLE_EXTERNAL_SERVICES = 'true'
}

// Set test environment
process.env.NODE_ENV = 'test'

// Log environment setup for debugging
console.log('Integration test environment variables:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET')
