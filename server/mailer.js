import crypto from 'node:crypto'
import nodemailer from 'nodemailer'
import { SCHOOL } from '../src/lib/data.js'

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Return school payment instructions from environment configuration. */
export function getPaymentChannels() {
  return {
    gcashName: process.env.PAYMENT_GCASH_NAME || SCHOOL.fullName,
    gcashNumber: process.env.PAYMENT_GCASH_NUMBER || '0917 000 0000',
    bankName: process.env.PAYMENT_BANK_NAME || 'BDO / UnionBank',
    bankAccountName: process.env.PAYMENT_BANK_ACCOUNT_NAME || SCHOOL.fullName,
    bankAccountNumber: process.env.PAYMENT_BANK_ACCOUNT_NUMBER || '0000-0000-0000',
    onsiteLocation: process.env.PAYMENT_ONSITE_LOCATION || 'Timalan Balsahan, Naic, Cavite (Mon-Fri, 8:00 AM - 12:00 PM)',
    contactEmail: process.env.SCHOOL_EMAIL || SCHOOL.email,
    contactPhone: process.env.SCHOOL_PHONE || SCHOOL.phone,
  }
}

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

function formatPaymentText(refCode, payment) {
  return [
    'WHERE TO SEND YOUR ENROLLMENT PAYMENT:',
    `1. GCash: ${payment.gcashName} (${payment.gcashNumber})`,
    `2. Bank Transfer (${payment.bankName}): ${payment.bankAccountName} - Acct # ${payment.bankAccountNumber}`,
    `3. On-Site Cashier: ${payment.onsiteLocation}`,
    '',
    `Important: Please include your Reference Code (${refCode}) in the payment notes and reply to ${payment.contactEmail} with your payment receipt/screenshot so our staff can confirm your slot.`,
  ].join('\n')
}

function formatPaymentHtml(refCode, payment) {
  return `
    <div style="margin-top:18px;padding:16px;border-radius:12px;background:#fdf8ec;border:1px solid #dfa944;">
      <p style="margin:0 0 10px;font-weight:800;color:#0a1272;">Where to Send Your Enrollment Payment</p>
      <ul style="margin:0;padding-left:18px;color:#1b2150;line-height:1.6;">
        <li><strong>GCash:</strong> ${escapeHtml(payment.gcashName)} &mdash; <strong>${escapeHtml(payment.gcashNumber)}</strong></li>
        <li><strong>Bank Transfer (${escapeHtml(payment.bankName)}):</strong> ${escapeHtml(payment.bankAccountName)} &mdash; Acct # <strong>${escapeHtml(payment.bankAccountNumber)}</strong></li>
        <li><strong>On-Site Cashier:</strong> ${escapeHtml(payment.onsiteLocation)}</li>
      </ul>
      <p style="margin:12px 0 0;font-size:13px;color:#475569;">
        Please indicate Reference Code <strong>${escapeHtml(refCode)}</strong> and reply to
        <strong>${escapeHtml(payment.contactEmail)}</strong> with your proof of payment so we can finalize your enrollment.
      </p>
    </div>
  `
}

const EVENT_COPY = {
  submitted: {
    subjectPrefix: 'Enrollment Application Received (Pending Approval)',
    headline: 'We Received Your Enrollment Application',
    intro:
      'Thank you for applying! Your child’s enrollment application is currently Pending Admin Approval. You will receive another email update along with payment instructions once our administrator approves it.',
    includePayment: false,
  },
  Approved: {
    subjectPrefix: 'Enrollment Approved + Payment Instructions',
    headline: 'Your Enrollment Application Has Been Approved!',
    intro:
      'Good news! Our school administrator has approved your child’s enrollment application. To secure your child’s slot, please complete the enrollment payment using any of the channels below.',
    includePayment: true,
  },
  Contacted: {
    subjectPrefix: 'Enrollment Update & Payment Reminder',
    headline: 'Enrollment Application Update',
    intro:
      'Our staff has reviewed your approved application and initiated contact with you. Below are the payment channels should you be ready to settle the enrollment fee.',
    includePayment: true,
  },
  Enrolled: {
    subjectPrefix: 'Official Enrollment Confirmed!',
    headline: 'Welcome to Keziah’s Whimsical Beginning Learning Hub!',
    intro:
      'Your enrollment and payment have been confirmed. Your child is now officially enrolled! Our team will send class schedule and orientation details soon.',
    includePayment: false,
  },
  Declined: {
    subjectPrefix: 'Enrollment Application Update',
    headline: 'Enrollment Application Status Update',
    intro:
      'We regret to inform you that your enrollment application could not be approved at this time. Please see the remarks below or reach out to our office for assistance.',
    includePayment: false,
  },
}

/** Build subject, plain-text, and HTML bodies for an enrollment lifecycle email. */
export function buildEnrollmentEmail({ enrollment, eventType, paymentChannels }) {
  const copy = EVENT_COPY[eventType] || EVENT_COPY.submitted
  const ref = enrollment.referenceCode || enrollment.reference_code
  const child = enrollment.childName || enrollment.child_name
  const parent = enrollment.parentName || enrollment.parent_name
  const notes = enrollment.adminNotes ?? enrollment.admin_notes ?? ''

  const subject = `[${ref}] ${copy.subjectPrefix} - ${child}`

  const textParts = [
    `Dear ${parent},`,
    '',
    copy.intro,
    '',
    `Reference Code: ${ref}`,
    `Child Name: ${child}`,
    `Program: ${enrollment.program}`,
    `Branch: ${enrollment.branch}`,
    `Status: ${enrollment.status}`,
  ]

  if (notes) {
    textParts.push(`Admin Remarks: ${notes}`)
  }
  if (copy.includePayment) {
    textParts.push('', formatPaymentText(ref, paymentChannels))
  }
  textParts.push(
    '',
    `For questions, contact us at ${paymentChannels.contactEmail} or ${paymentChannels.contactPhone}.`,
    `— ${SCHOOL.fullName}`,
  )

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e4e7fb;border-radius:16px;overflow:hidden;">
      <div style="background:#0a1272;padding:20px 24px;color:#ffffff;border-bottom:4px solid #dfa944;">
        <p style="margin:0;font-size:12px;letter-spacing:1.5px;color:#e8bb64;font-weight:700;">KEZIAH'S WHIMSICAL BEGINNING LEARNING HUB</p>
        <h2 style="margin:6px 0 0;font-size:20px;">${escapeHtml(copy.headline)}</h2>
      </div>
      <div style="padding:24px;color:#1b2150;font-size:14px;line-height:1.6;">
        <p style="margin-top:0;">Dear <strong>${escapeHtml(parent)}</strong>,</p>
        <p>${escapeHtml(copy.intro)}</p>
        <div style="background:#f3f4fe;border-radius:12px;padding:14px 16px;margin:16px 0;">
          <p style="margin:4px 0;"><strong>Reference Code:</strong> ${escapeHtml(ref)}</p>
          <p style="margin:4px 0;"><strong>Child:</strong> ${escapeHtml(child)}</p>
          <p style="margin:4px 0;"><strong>Program:</strong> ${escapeHtml(enrollment.program)}</p>
          <p style="margin:4px 0;"><strong>Branch:</strong> ${escapeHtml(enrollment.branch)}</p>
          <p style="margin:4px 0;"><strong>Current Status:</strong> ${escapeHtml(enrollment.status)}</p>
          ${notes ? `<p style="margin:8px 0 0;"><strong>Admin Remarks:</strong> ${escapeHtml(notes)}</p>` : ''}
        </div>
        ${copy.includePayment ? formatPaymentHtml(ref, paymentChannels) : ''}
        <p style="margin-top:20px;font-size:13px;color:#64748b;">
          Questions? Contact us at ${escapeHtml(paymentChannels.contactEmail)} or ${escapeHtml(paymentChannels.contactPhone)}.
        </p>
      </div>
    </div>
  `

  return { subject, text: textParts.join('\n'), html }
}

/** Send (if SMTP is configured) and persist an enrollment update email log in MySQL. */
export async function sendAndLogEnrollmentEmail({ pool, enrollment, eventType }) {
  const recipient = String(enrollment.email || '').trim()
  if (!recipient) {
    return {
      skipped: true,
      deliveryStatus: 'failed',
      errorMessage: 'No email address on record for this applicant.',
    }
  }

  const paymentChannels = getPaymentChannels()
  const { subject, text, html } = buildEnrollmentEmail({ enrollment, eventType, paymentChannels })
  const logId = crypto.randomUUID()
  const from = process.env.SMTP_FROM || `"${SCHOOL.fullName}" <${paymentChannels.contactEmail}>`

  let deliveryStatus = 'logged_only'
  let errorMessage = ''

  if (isSmtpConfigured()) {
    try {
      const transporter = createTransport()
      await transporter.sendMail({ from, to: recipient, subject, text, html })
      deliveryStatus = 'sent'
    } catch (err) {
      deliveryStatus = 'failed'
      errorMessage = err.message || 'SMTP delivery failed'
    }
  } else {
    errorMessage = 'SMTP credentials not configured in server/.env; email saved in email_logs.'
  }

  await pool.query(
    `INSERT INTO email_logs
       (id, enrollment_id, recipient_email, event_type, subject, body_text, delivery_status, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [logId, enrollment.id, recipient, eventType, subject, text, deliveryStatus, errorMessage || null],
  )

  return {
    id: logId,
    recipientEmail: recipient,
    eventType,
    subject,
    bodyText: text,
    deliveryStatus,
    errorMessage: errorMessage || null,
    sentAt: new Date().toISOString(),
  }
}

