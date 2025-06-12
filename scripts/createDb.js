#!/usr/bin/env node
/**
 * Create the target database if it does not exist.
 * Connects to the default 'postgres' database using DATABASE_URL,
 * then checks for the existence of the desired database and creates it if missing.
 */
const { Client } = require('pg')

async function ensureDatabase() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('DATABASE_URL environment variable is not set.')
    process.exit(1)
  }
  try {
    const url = new URL(dbUrl)
    const dbName = url.pathname.slice(1)
    // Connect to default 'postgres' database
    url.pathname = '/postgres'
    const adminClient = new Client({ connectionString: url.toString() })
    await adminClient.connect()
    const res = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    )
    if (res.rowCount === 0) {
      console.log(`Database '${dbName}' not found. Creating...`)
      await adminClient.query(`CREATE DATABASE ${dbName}`)
      console.log(`Database '${dbName}' created.`)
    } else {
      console.log(`Database '${dbName}' already exists.`)
    }
    await adminClient.end()
  } catch (err) {
    console.error('Error ensuring database exists:', err)
    process.exit(1)
  }
}

ensureDatabase()