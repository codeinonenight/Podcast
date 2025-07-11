#!/usr/bin/env node

const { execSync } = require('child_process')
const path = require('path')

console.log('🗄️  Initializing database...')

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...')
  execSync('npx prisma generate', { stdio: 'inherit' })

  // Check if database is accessible
  console.log('🔍 Checking database connection...')
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })

  console.log('✅ Database initialization completed successfully!')
} catch (error) {
  console.error('❌ Database initialization failed:', error.message)
  process.exit(1)
} 