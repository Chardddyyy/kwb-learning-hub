import { useEffect, useState } from 'react'
import { CheckCircle2, GraduationCap, Mail, MessageSquare, PhoneCall, Send, X, XCircle } from 'lucide-react'
import { getEnrollmentEmails, resendEnrollmentEmail } from '../../lib/store.js'

function getAgeText(birthdate) {
  if (!birthdate) return ''
  const born = new Date(birthdate)
  if (Number.isNaN(born.getTime())) return ''
  const now = new Date()
  let years = now.getFullYear() - born.getFullYear()
  const m = now.getMonth() - born.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) years--
  return years >= 0 ? `(${years} yrs old)` : ''
}

const DELIVERY_BADGE = {
  sent: 'bg-emerald-100 text-emerald-800',
  logged_only: 'bg-amber-100 text-amber-800',
  failed: 'bg-rose-100 text-rose-800',
}

/** Modal dialog allowing admins to inspect an inquiry, view email logs, and approve/decline. */
export default function ReviewModal({ record, busy, smtpConfigured, onClose, onReview }) {
  const [notes, setNotes] = useState(record?.adminNotes || '')
  const [emails, setEmails] = useState([])
  const [emailsLoading, setEmailsLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [emailFeedback, setEmailFeedback] = useState('')

  useEffect(() => {
    if (!record?.id) return
    let active = true
    setEmailsLoading(true)
    getEnrollmentEmails(record.id)
      .then((list) => {
        if (active) setEmails(list)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setEmailsLoading(false)
      })
    return () => { active = false }
  }, [record?.id])

  if (!record) return null

  const submitAction = (status) => onReview(record.id, { status, adminNotes: notes })

  const handleResend = async () => {
    setResending(true)
    setEmailFeedback('')
    try {
      const log = await resendEnrollmentEmail(record.id)
      setEmails((prev) => [log, ...prev])
      setEmailFeedback(
        log.deliveryStatus === 'sent'
          ? `Email sent to ${log.recipientEmail}.`
          : `Email logged to database for ${log.recipientEmail} (SMTP not configured).`,
      )
    } catch (err) {
      setEmailFeedback(err.message || 'Could not send email.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy-100 bg-navy-900 px-6 py-4 text-white">
          <div>
            <p className="font-mono text-xs font-bold text-gold-400">{record.referenceCode || record.id}</p>
            <h2 className="font-display text-xl font-extrabold">{record.childName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close review modal"
            className="rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-3 rounded-2xl bg-navy-50/80 p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Birthdate</p>
              <p className="font-bold text-navy-900">
                {record.birthdate} <span className="font-normal text-slate-500">{getAgeText(record.birthdate)}</span>
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Current Status</p>
              <p className="font-extrabold text-navy-900">{record.status}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Program</p>
              <p className="font-bold text-navy-900">{record.program}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Preferred Branch</p>
              <p className="font-bold text-navy-900">{record.branch}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Parent / Guardian</p>
              <p className="font-bold text-navy-900">{record.parentName}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Contact Details</p>
              <p className="font-bold text-navy-900">{record.phone}</p>
              <p className="break-all text-xs font-semibold text-navy-700">{record.email || 'No email provided'}</p>
            </div>
          </div>

          {record.message && (
            <div className="rounded-2xl border border-navy-100 p-4 text-sm">
              <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                <MessageSquare size={14} /> Parent Message
              </p>
              <p className="mt-1.5 text-slate-700">{record.message}</p>
            </div>
          )}

          {record.reviewedBy && (
            <p className="text-xs font-semibold text-slate-500">
              Last reviewed by <span className="font-bold text-navy-900">{record.reviewedBy}</span> on{' '}
              {new Date(record.reviewedAt).toLocaleString('en-PH')}
            </p>
          )}

          <label className="block text-sm font-bold text-navy-900">
            Admin Remarks / Notes (included in email notification)
            <textarea
              rows="3"
              placeholder="Optional notes (e.g. schedule orientation, payment deadline, missing requirements)..."
              className="field mt-1.5"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          {record.email && (
            <div className="rounded-2xl border border-gold-400/60 bg-gold-50/70 p-3.5 text-xs text-navy-900">
              <p className="flex items-center gap-1.5 font-extrabold">
                <Mail size={14} className="text-gold-600" />
                Automatic Email + Payment Update
              </p>
              <p className="mt-1 text-slate-600">
                Approving this application will{' '}
                {smtpConfigured ? 'send an email' : 'generate & log an email update'} with GCash/Bank/Cashier payment
                instructions to <strong className="break-all text-navy-900">{record.email}</strong>.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2.5 border-t border-navy-100 pt-4">
            {record.status === 'Pending' ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => submitAction('Approved')}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  <CheckCircle2 size={16} /> Approve &amp; Send Payment Info
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => submitAction('Declined')}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-rose-700 disabled:opacity-60"
                >
                  <XCircle size={16} /> Decline
                </button>
              </>
            ) : (
              <>
                {record.status !== 'Approved' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => submitAction('Approved')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <CheckCircle2 size={15} /> Approve
                  </button>
                )}
                {record.status !== 'Contacted' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => submitAction('Contacted')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-sky-700 disabled:opacity-60"
                  >
                    <PhoneCall size={15} /> Mark Contacted
                  </button>
                )}
                {record.status !== 'Enrolled' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => submitAction('Enrolled')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-navy-700 disabled:opacity-60"
                  >
                    <GraduationCap size={15} /> Mark Enrolled
                  </button>
                )}
                {record.status !== 'Declined' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => submitAction('Declined')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    <XCircle size={15} /> Decline
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => submitAction(record.status)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-navy-200 px-3.5 py-2 text-xs font-extrabold text-navy-900 hover:bg-navy-50 disabled:opacity-60"
                >
                  Save Remarks
                </button>
              </>
            )}
          </div>

          <div className="border-t border-navy-100 pt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Email Update Logs ({emails.length})
              </p>
              {record.email && (
                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResend}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-navy-50 px-3 py-1.5 text-xs font-extrabold text-navy-900 hover:bg-navy-100 disabled:opacity-60"
                >
                  <Send size={13} /> {resending ? 'Sending...' : 'Resend Update Email'}
                </button>
              )}
            </div>

            {emailFeedback && (
              <p className="mt-2 rounded-lg bg-navy-50 px-3 py-2 text-xs font-bold text-navy-900">{emailFeedback}</p>
            )}

            <div className="mt-2.5 space-y-2">
              {emailsLoading && <p className="text-xs text-slate-500">Loading email history...</p>}
              {!emailsLoading && emails.length === 0 && (
                <p className="text-xs text-slate-500">No email notifications recorded for this record yet.</p>
              )}
              {!emailsLoading &&
                emails.map((item) => (
                  <details key={item.id} className="rounded-xl border border-navy-100 bg-navy-50/40 p-3 text-xs">
                    <summary className="flex cursor-pointer items-center justify-between gap-2 font-bold text-navy-900">
                      <span className="truncate">{item.subject}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                          DELIVERY_BADGE[item.deliveryStatus] || DELIVERY_BADGE.logged_only
                        }`}
                      >
                        {item.deliveryStatus === 'sent'
                          ? 'Sent'
                          : item.deliveryStatus === 'logged_only'
                            ? 'Logged'
                            : 'Failed'}
                      </span>
                    </summary>
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      To: {item.recipientEmail} &middot; {new Date(item.sentAt).toLocaleString('en-PH')}
                    </p>
                    {item.errorMessage && (
                      <p className="mt-1 text-[11px] font-semibold text-amber-700">{item.errorMessage}</p>
                    )}
                    <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-white p-2.5 font-sans text-[11px] text-slate-700">
                      {item.bodyText}
                    </pre>
                  </details>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
