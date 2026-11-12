import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import mysql from 'mysql2/promise'
import { BRANCHES, PROGRAMS } from '../src/lib/data.js'
import { dbConfig, pool } from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ENROLLMENT_MIGRATIONS = [
  {
    column: 'reference_code',
    sql: 'ALTER TABLE enrollments ADD COLUMN reference_code VARCHAR(24) NULL UNIQUE AFTER id',
  },
  {
    column: 'reviewed_by',
    sql: 'ALTER TABLE enrollments ADD COLUMN reviewed_by VARCHAR(60) NULL AFTER status',
  },
  {
    column: 'reviewed_at',
    sql: 'ALTER TABLE enrollments ADD COLUMN reviewed_at TIMESTAMP NULL AFTER reviewed_by',
  },
  {
    column: 'admin_notes',
    sql: 'ALTER TABLE enrollments ADD COLUMN admin_notes TEXT AFTER reviewed_at',
  },
]

async function migrateEnrollmentsTable() {
  const [columns] = await pool.query(
    `SELECT COLUMN_NAME, COLUMN_TYPE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'enrollments'`,
    [dbConfig.database],
  )
  const colMap = new Map(columns.map((c) => [c.COLUMN_NAME, c.COLUMN_TYPE]))

  for (const m of ENROLLMENT_MIGRATIONS) {
    if (!colMap.has(m.column)) {
      await pool.query(m.sql)
    }
  }

  const statusType = String(colMap.get('status') || '')
  if (!statusType.includes("'Approved'")) {
    await pool.query(
      `ALTER TABLE enrollments
       MODIFY COLUMN status ENUM('Pending', 'Approved', 'Contacted', 'Enrolled', 'Declined') NOT NULL DEFAULT 'Pending'`,
    )
  }

  await pool.query(
    `UPDATE enrollments
     SET reference_code = CONCAT('KWB-', YEAR(created_at), '-', UPPER(SUBSTRING(REPLACE(id, '-', ''), 1, 6)))
     WHERE reference_code IS NULL`,
  )
}

/** Create the MySQL database, tables, migrations, and default seed records if absent. */
export async function ensureDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql')
  const schemaSql = await fs.readFile(schemaPath, 'utf8')

  const bootstrap = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    multipleStatements: true,
  })

  try {
    await bootstrap.query(schemaSql)
  } finally {
    await bootstrap.end()
  }

  await migrateEnrollmentsTable()

  const adminUser = process.env.ADMIN_USERNAME || 'admin'
  const adminPass = process.env.ADMIN_PASSWORD || 'kwb2024'

  const [existingAdmins] = await pool.query(
    'SELECT id FROM admins WHERE username = ? LIMIT 1',
    [adminUser],
  )
  if (existingAdmins.length === 0) {
    const hash = await bcrypt.hash(adminPass, 10)
    await pool.query(
      'INSERT INTO admins (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      [adminUser, hash, 'School Administrator', 'admin'],
    )
  }

  for (const branch of BRANCHES) {
    await pool.query(
      `INSERT IGNORE INTO branches (id, name, status, address, hours, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [branch.id, branch.name, branch.status, branch.address, branch.hours, branch.description],
    )
  }

  for (const program of PROGRAMS) {
    await pool.query(
      `INSERT IGNORE INTO programs (id, name, age_range, color, blurb, skills)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [program.id, program.name, program.age, program.color, program.blurb, JSON.stringify(program.skills)],
    )
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  ensureDatabase()
    .then(async () => {
      console.log(`Database "${dbConfig.database}" initialized and migrated successfully.`)
      await pool.end()
    })
    .catch(async (err) => {
      console.error('Failed to initialize database:', err.message)
      await pool.end().catch(() => {})
      process.exit(1)
    })
}
