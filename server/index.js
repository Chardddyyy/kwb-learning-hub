import crypto from 'node:crypto'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { dbConfig, pool } from './db.js'
import { ensureDatabase } from './initDb.js'
import { getPaymentChannels, isSmtpConfigured, sendAndLogEnrollmentEmail } from './mailer.js'

const PORT = Number(process.env.PORT || 4000)
const JWT_SECRET = process.env.JWT_SECRET || 'kwblh_local_dev_jwt_secret_2026'
const VALID_STATUSES = ['Pending', 'Approved', 'Contacted', 'Enrolled', 'Declined']
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

const app = express()

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
      return cb(new Error('Origin not allowed by CORS'))
    },
  }),
)
app.use(express.json({ limit: '1mb' }))

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

function mapEnrollment(row) {
  return {
    id: row.id,
    referenceCode: row.reference_code || '',
    childName: row.child_name,
    birthdate: row.birthdate,
    program: row.program,
    branch: row.branch,
    parentName: row.parent_name,
    phone: row.phone,
    email: row.email || '',
    message: row.message || '',
    status: row.status,
    reviewedBy: row.reviewed_by || null,
    reviewedAt: row.reviewed_at || null,
    adminNotes: row.admin_notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapEmailLog(row) {
  return {
    id: row.id,
    enrollmentId: row.enrollment_id,
    recipientEmail: row.recipient_email,
    eventType: row.event_type,
    subject: row.subject,
    bodyText: row.body_text,
    deliveryStatus: row.delivery_status,
    errorMessage: row.error_message || null,
    sentAt: row.sent_at,
  }
}

function generateReferenceCode() {
  const year = new Date().getFullYear()
  const code = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `KWB-${year}-${code}`
}

function normalizeDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' })
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    return next()
  } catch {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' })
  }
}

async function applyEnrollmentReview(req, res) {
  const { id } = req.params
  const status = String(req.body?.status || '').trim()
  const hasNotes = req.body?.adminNotes !== undefined
  const adminNotes = hasNotes ? String(req.body.adminNotes || '').trim() : null

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` })
  }

  const [existingRows] = await pool.query('SELECT * FROM enrollments WHERE id = ? LIMIT 1', [id])
  const current = existingRows[0]
  if (!current) {
    return res.status(404).json({ error: 'Enrollment record not found.' })
  }

  // Enforce admin approval before an application can be marked as Enrolled.
  if (current.status === 'Pending' && status === 'Enrolled') {
    return res.status(400).json({
      error: 'Application must be approved by an admin before marking as Enrolled.',
    })
  }

  const isPending = status === 'Pending'
  const reviewedBy = isPending ? null : req.user.username

  if (hasNotes) {
    await pool.query(
      `UPDATE enrollments
       SET status = ?, reviewed_by = ?, reviewed_at = ${isPending ? 'NULL' : 'CURRENT_TIMESTAMP'}, admin_notes = ?
       WHERE id = ?`,
      [status, reviewedBy, adminNotes, id],
    )
  } else {
    await pool.query(
      `UPDATE enrollments
       SET status = ?, reviewed_by = ?, reviewed_at = ${isPending ? 'NULL' : 'CURRENT_TIMESTAMP'}
       WHERE id = ?`,
      [status, reviewedBy, id],
    )
  }

  const [updatedRows] = await pool.query('SELECT * FROM enrollments WHERE id = ?', [id])
  const updated = mapEnrollment(updatedRows[0])

  let emailNotification = null
  if (!isPending && (current.status !== status || req.body?.sendEmail === true)) {
    emailNotification = await sendAndLogEnrollmentEmail({
      pool,
      enrollment: updated,
      eventType: status,
    })
  }

  return res.json({ ...updated, emailNotification })
}

app.get('/', (_req, res) => {
  res.json({
    service: "Keziah's Whimsical Beginning Learning Hub API",
    status: 'running',
    database: dbConfig.database,
    smtpConfigured: isSmtpConfigured(),
    endpoints: [
      'GET /api/health',
      'GET /api/school-data',
      'GET /api/payment-config',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'POST /api/auth/logout',
      'POST /api/enrollments',
      'GET /api/enrollments/status',
      'GET /api/enrollments',
      'GET /api/enrollments/:id/emails',
      'POST /api/enrollments/:id/resend-email',
      'GET /api/analytics',
      'PATCH /api/enrollments/:id/review',
      'PATCH /api/enrollments/:id/status',
      'DELETE /api/enrollments/:id',
    ],
  })
})

app.get(
  '/api/health',
  asyncHandler(async (_req, res) => {
    await pool.query('SELECT 1')
    res.json({ ok: true, database: dbConfig.database, smtpConfigured: isSmtpConfigured() })
  }),
)

app.get(
  '/api/school-data',
  asyncHandler(async (_req, res) => {
    const [branches] = await pool.query(
      'SELECT id, name, status, address, hours, description FROM branches ORDER BY created_at ASC',
    )
    const [programRows] = await pool.query(
      'SELECT id, name, age_range AS age, color, blurb, skills FROM programs ORDER BY created_at ASC',
    )
    const programs = programRows.map((p) => ({
      ...p,
      skills: typeof p.skills === 'string' ? JSON.parse(p.skills) : p.skills,
    }))
    res.json({ branches, programs })
  }),
)

app.get('/api/payment-config', requireAuth, (_req, res) => {
  res.json({
    paymentChannels: getPaymentChannels(),
    smtpConfigured: isSmtpConfigured(),
  })
})

app.post(
  '/api/auth/login',
  asyncHandler(async (req, res) => {
    const username = String(req.body?.username || '').trim()
    const password = String(req.body?.password || '')

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' })
    }

    const [rows] = await pool.query(
      'SELECT id, username, password_hash, full_name, role FROM admins WHERE username = ? LIMIT 1',
      [username],
    )
    const admin = rows[0]
    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({ error: 'Incorrect username or password.' })
    }

    const payload = {
      id: admin.id,
      username: admin.username,
      fullName: admin.full_name,
      role: admin.role,
    }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' })
    return res.json({ token, user: payload })
  }),
)

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ authenticated: true, user: req.user })
})

app.post('/api/auth/logout', (_req, res) => {
  res.json({ ok: true })
})

app.post(
  '/api/enrollments',
  asyncHandler(async (req, res) => {
    const childName = String(req.body?.childName || '').trim()
    const birthdate = String(req.body?.birthdate || '').trim()
    const program = String(req.body?.program || '').trim()
    const branch = String(req.body?.branch || '').trim()
    const parentName = String(req.body?.parentName || '').trim()
    const phone = String(req.body?.phone || '').trim()
    const email = String(req.body?.email || '').trim().toLowerCase()
    const message = String(req.body?.message || '').trim()

    if (!childName || !birthdate || !program || !branch || !parentName || !phone || !email) {
      return res.status(400).json({
        error: 'Please complete all required enrollment fields including email address.',
      })
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        error: 'Please enter a valid email address for approval updates and payment details.',
      })
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
      return res.status(400).json({ error: 'Birthdate must be formatted as YYYY-MM-DD.' })
    }

    const id = crypto.randomUUID()
    const referenceCode = generateReferenceCode()

    await pool.query(
      `INSERT INTO enrollments
         (id, reference_code, child_name, birthdate, program, branch, parent_name, phone, email, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [id, referenceCode, childName, birthdate, program, branch, parentName, phone, email, message],
    )

    const [createdRows] = await pool.query('SELECT * FROM enrollments WHERE id = ?', [id])
    const created = mapEnrollment(createdRows[0])
    const emailNotification = await sendAndLogEnrollmentEmail({
      pool,
      enrollment: created,
      eventType: 'submitted',
    })

    return res.status(201).json({ ...created, emailNotification })
  }),
)

app.get(
  '/api/enrollments/status',
  asyncHandler(async (req, res) => {
    const ref = String(req.query?.ref || '').trim().toUpperCase()
    const phone = normalizeDigits(req.query?.phone)

    if (!ref || !phone) {
      return res.status(400).json({ error: 'Reference code and mobile number are required.' })
    }

    const [rows] = await pool.query(
      `SELECT reference_code, child_name, program, branch, phone, email, status, admin_notes, reviewed_at, created_at
       FROM enrollments
       WHERE UPPER(reference_code) = ?
       LIMIT 1`,
      [ref],
    )
    const row = rows[0]
    if (!row || normalizeDigits(row.phone) !== phone) {
      return res.status(404).json({ error: 'No matching enrollment found for that reference code and phone.' })
    }

    const showPayment = row.status === 'Approved' || row.status === 'Contacted'
    return res.json({
      referenceCode: row.reference_code,
      childName: row.child_name,
      program: row.program,
      branch: row.branch,
      email: row.email || '',
      status: row.status,
      adminNotes: row.admin_notes || '',
      reviewedAt: row.reviewed_at || null,
      createdAt: row.created_at,
      paymentChannels: showPayment ? getPaymentChannels() : null,
    })
  }),
)

app.get(
  '/api/enrollments',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.query('SELECT * FROM enrollments ORDER BY created_at DESC')
    res.json(rows.map(mapEnrollment))
  }),
)

app.get(
  '/api/enrollments/:id/emails',
  requireAuth,
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      'SELECT * FROM email_logs WHERE enrollment_id = ? ORDER BY sent_at DESC',
      [req.params.id],
    )
    res.json(rows.map(mapEmailLog))
  }),
)

app.post(
  '/api/enrollments/:id/resend-email',
  requireAuth,
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM enrollments WHERE id = ? LIMIT 1', [req.params.id])
    if (!rows[0]) {
      return res.status(404).json({ error: 'Enrollment record not found.' })
    }
    const enrollment = mapEnrollment(rows[0])
    const eventType = enrollment.status === 'Pending' ? 'submitted' : enrollment.status
    const emailNotification = await sendAndLogEnrollmentEmail({ pool, enrollment, eventType })
    if (emailNotification.skipped) {
      return res.status(400).json({ error: emailNotification.errorMessage })
    }
    return res.json(emailNotification)
  }),
)

app.get(
  '/api/analytics',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const [[summaryRow]] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'Pending') AS pending,
        SUM(status = 'Approved') AS approved,
        SUM(status = 'Contacted') AS contacted,
        SUM(status = 'Enrolled') AS enrolled,
        SUM(status = 'Declined') AS declined
      FROM enrollments
    `)

    const total = Number(summaryRow.total || 0)
    const pending = Number(summaryRow.pending || 0)
    const approved = Number(summaryRow.approved || 0)
    const contacted = Number(summaryRow.contacted || 0)
    const enrolled = Number(summaryRow.enrolled || 0)
    const declined = Number(summaryRow.declined || 0)
    const approvedOrFurther = approved + contacted + enrolled
    const reviewed = total - pending

    const summary = {
      total,
      pending,
      approved,
      contacted,
      enrolled,
      declined,
      reviewed,
      approvalRate: reviewed > 0 ? Math.round((approvedOrFurther / reviewed) * 100) : 0,
      enrollmentRate: total > 0 ? Math.round((enrolled / total) * 100) : 0,
    }

    const [programList] = await pool.query('SELECT name FROM programs ORDER BY created_at ASC')
    const [programCounts] = await pool.query(`
      SELECT
        program,
        COUNT(*) AS total,
        SUM(status = 'Pending') AS pending,
        SUM(status IN ('Approved', 'Contacted', 'Enrolled')) AS approved,
        SUM(status = 'Enrolled') AS enrolled,
        SUM(status = 'Declined') AS declined
      FROM enrollments
      GROUP BY program
    `)
    const progMap = new Map(programCounts.map((r) => [r.program, r]))
    const byProgram = programList.map(({ name }) => {
      const stats = progMap.get(name)
      return {
        program: name,
        total: Number(stats?.total || 0),
        pending: Number(stats?.pending || 0),
        approved: Number(stats?.approved || 0),
        enrolled: Number(stats?.enrolled || 0),
        declined: Number(stats?.declined || 0),
      }
    })

    const [branchList] = await pool.query('SELECT name FROM branches ORDER BY created_at ASC')
    const [branchCounts] = await pool.query(`
      SELECT
        branch,
        COUNT(*) AS total,
        SUM(status = 'Pending') AS pending,
        SUM(status IN ('Approved', 'Contacted', 'Enrolled')) AS approved,
        SUM(status = 'Enrolled') AS enrolled
      FROM enrollments
      GROUP BY branch
    `)
    const branchMap = new Map(branchCounts.map((r) => [r.branch, r]))
    const byBranch = branchList.map(({ name }) => {
      const stats = branchMap.get(name)
      return {
        branch: name,
        total: Number(stats?.total || 0),
        pending: Number(stats?.pending || 0),
        approved: Number(stats?.approved || 0),
        enrolled: Number(stats?.enrolled || 0),
      }
    })

    const [trendRows] = await pool.query(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m-%d') AS day,
        COUNT(*) AS total,
        SUM(status IN ('Approved', 'Contacted', 'Enrolled')) AS approved
      FROM enrollments
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      ORDER BY day ASC
    `)
    const trendMap = new Map(trendRows.map((r) => [r.day, r]))
    const dailyTrend = []
    for (let offset = 6; offset >= 0; offset--) {
      const d = new Date()
      d.setDate(d.getDate() - offset)
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const hit = trendMap.get(iso)
      dailyTrend.push({
        date: iso,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        total: Number(hit?.total || 0),
        approved: Number(hit?.approved || 0),
      })
    }

    res.json({ summary, byProgram, byBranch, dailyTrend })
  }),
)

app.patch('/api/enrollments/:id/review', requireAuth, asyncHandler(applyEnrollmentReview))
app.patch('/api/enrollments/:id/status', requireAuth, asyncHandler(applyEnrollmentReview))

app.delete(
  '/api/enrollments/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const [result] = await pool.query('DELETE FROM enrollments WHERE id = ?', [req.params.id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Enrollment record not found.' })
    }
    return res.json({ ok: true })
  }),
)

app.use((err, _req, res, _next) => {
  console.error(err)
  const status = err.message === 'Origin not allowed by CORS' ? 403 : 500
  res.status(status).json({ error: err.message || 'Internal server error.' })
})

ensureDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`KWBLH backend listening on http://localhost:${PORT} (MySQL: ${dbConfig.database})`)
    })
  })
  .catch((err) => {
    console.error('Failed to start backend server:', err)
    process.exit(1)
  })
