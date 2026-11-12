import { useState } from 'react'
import { CheckCircle2, Clock, CreditCard, Mail, Search, ShieldCheck } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import { PROGRAMS, BRANCHES } from '../lib/data.js'
import { addEnrollment, checkEnrollmentStatus } from '../lib/store.js'

const empty = {
  childName: '',
  birthdate: '',
  program: PROGRAMS[0].name,
  branch: BRANCHES[0].name,
  parentName: '',
  phone: '',
  email: '',
  message: '',
}

const STATUS_MESSAGES = {
  Pending: {
    label: 'Pending Admin Approval',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    desc: 'Your application is queued for review by our school administrator. Once approved, an email with payment details will be sent to you.',
  },
  Approved: {
    label: 'Approved by Admin',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    desc: 'Your enrollment application has been approved! Please send your enrollment payment using any of the channels below.',
  },
  Contacted: {
    label: 'Approved & Contacted',
    badge: 'bg-sky-100 text-sky-800 border-sky-200',
    desc: 'Your application was approved and our team has initiated contact with you. You may settle payment using the channels below.',
  },
  Enrolled: {
    label: 'Officially Enrolled',
    badge: 'bg-navy-900 text-white border-navy-900',
    desc: 'Welcome to Keziah’s Whimsical Beginning Learning Hub!',
  },
  Declined: {
    label: 'Declined',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    desc: 'This application was not approved. Please check the remarks below or contact the school.',
  },
}

export default function Enroll() {
  const [mode, setMode] = useState('apply')
  const [form, setForm] = useState(empty)
  const [submitted, setSubmitted] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [lookupRef, setLookupRef] = useState('')
  const [lookupPhone, setLookupPhone] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [lookupResult, setLookupResult] = useState(null)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const created = await addEnrollment(form)
      setForm(empty)
      setSubmitted(created)
      window.scrollTo(0, 0)
    } catch (err) {
      setError(err.message || 'Unable to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const checkStatus = async (e) => {
    e.preventDefault()
    setLookupLoading(true)
    setLookupError('')
    setLookupResult(null)
    try {
      const result = await checkEnrollmentStatus(lookupRef, lookupPhone)
      setLookupResult(result)
    } catch (err) {
      setLookupError(err.message || 'Could not find a matching application.')
    } finally {
      setLookupLoading(false)
    }
  }

  const statusMeta = lookupResult ? STATUS_MESSAGES[lookupResult.status] || STATUS_MESSAGES.Pending : null

  return (
    <>
      <PageHeader title="Enrollment" subtitle="Submit an application for admin review or check your approval status" />
      <section className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-6 flex justify-center gap-2 rounded-full bg-navy-50 p-1.5">
          <button
            type="button"
            onClick={() => setMode('apply')}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-extrabold transition ${
              mode === 'apply' ? 'bg-navy-900 text-white shadow-sm' : 'text-navy-900 hover:bg-white/70'
            }`}
          >
            Submit Application
          </button>
          <button
            type="button"
            onClick={() => setMode('status')}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-extrabold transition ${
              mode === 'status' ? 'bg-navy-900 text-white shadow-sm' : 'text-navy-900 hover:bg-white/70'
            }`}
          >
            Check Approval Status
          </button>
        </div>

        {mode === 'apply' ? (
          submitted ? (
            <div className="rounded-3xl border-2 border-gold-400 bg-gold-50 p-8 text-center sm:p-10">
              <CheckCircle2 className="mx-auto text-gold-600" size={56} />
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-extrabold text-amber-800">
                <Clock size={14} /> Pending Admin Approval
              </span>
              <h2 className="mt-3 text-2xl font-extrabold text-navy-900">Application Submitted!</h2>
              <p className="mt-2 text-slate-600">
                Your enrollment application for <span className="font-bold text-navy-900">{submitted.childName}</span> has
                been received and is awaiting administrator approval.
              </p>

              <div className="mx-auto mt-4 flex max-w-md items-center justify-center gap-2 rounded-2xl bg-white/80 px-4 py-3 text-xs font-semibold text-navy-900">
                <Mail size={16} className="shrink-0 text-gold-600" />
                <span>
                  Approval updates &amp; enrollment payment instructions will be sent to{' '}
                  <strong className="break-all">{submitted.email}</strong>.
                </span>
              </div>

              <div className="mx-auto mt-5 max-w-xs rounded-2xl border border-gold-400/60 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Reference Code</p>
                <p className="mt-1 font-mono text-xl font-extrabold text-navy-900">{submitted.referenceCode}</p>
                <p className="mt-1 text-xs text-slate-500">Keep this code to check your approval status anytime.</p>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  className="btn btn-navy"
                  onClick={() => {
                    setLookupRef(submitted.referenceCode)
                    setLookupPhone(submitted.phone)
                    setLookupResult(null)
                    setMode('status')
                  }}
                >
                  Track Application
                </button>
                <button className="btn btn-gold" onClick={() => setSubmitted(null)}>
                  Submit another application
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5 rounded-3xl border-2 border-navy-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-start gap-3 rounded-2xl bg-navy-50 p-4 text-sm text-navy-900">
                <ShieldCheck className="mt-0.5 shrink-0 text-gold-600" size={20} />
                <p>
                  <span className="font-extrabold">Admin Approval &amp; Email Updates:</span> All submitted enrollment
                  applications start as <span className="font-bold">Pending</span>. Once approved by our administrator,
                  we will email your approval update and enrollment payment details.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-bold text-navy-900">Child&rsquo;s full name
                  <input required className="field mt-1" value={form.childName} onChange={set('childName')} />
                </label>
                <label className="block text-sm font-bold text-navy-900">Birthdate
                  <input required type="date" className="field mt-1" value={form.birthdate} onChange={set('birthdate')} />
                </label>
                <label className="block text-sm font-bold text-navy-900">Program
                  <select className="field mt-1" value={form.program} onChange={set('program')}>
                    {PROGRAMS.map((p) => <option key={p.id}>{p.name}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-bold text-navy-900">Preferred branch
                  <select className="field mt-1" value={form.branch} onChange={set('branch')}>
                    {BRANCHES.map((b) => (
                      <option key={b.id} value={b.name}>{b.name}{b.status === 'soon' ? ' (Soon to open)' : ''}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-bold text-navy-900">Parent / guardian name
                  <input required className="field mt-1" value={form.parentName} onChange={set('parentName')} />
                </label>
                <label className="block text-sm font-bold text-navy-900">Mobile number
                  <input required type="tel" className="field mt-1" value={form.phone} onChange={set('phone')} />
                </label>
              </div>
              <label className="block text-sm font-bold text-navy-900">
                Email address <span className="text-rose-600">*</span>
                <input
                  required
                  type="email"
                  placeholder="parent@example.com"
                  className="field mt-1"
                  value={form.email}
                  onChange={set('email')}
                />
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  Required &mdash; approval status updates and where to send enrollment payment will be sent to this email.
                </span>
              </label>
              <label className="block text-sm font-bold text-navy-900">Message (optional)
                <textarea rows="4" className="field mt-1" value={form.message} onChange={set('message')} />
              </label>
              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>
              )}
              <button type="submit" disabled={submitting} className="btn btn-gold w-full disabled:opacity-60">
                {submitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </form>
          )
        ) : (
          <div className="space-y-6 rounded-3xl border-2 border-navy-100 bg-white p-6 shadow-sm sm:p-8">
            <form onSubmit={checkStatus} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-navy-900">Reference Code
                  <input
                    required
                    placeholder="e.g. KWB-2026-A1B2C3"
                    className="field mt-1 font-mono uppercase"
                    value={lookupRef}
                    onChange={(e) => setLookupRef(e.target.value)}
                  />
                </label>
                <label className="block text-sm font-bold text-navy-900">Mobile Number
                  <input
                    required
                    type="tel"
                    placeholder="Used during application"
                    className="field mt-1"
                    value={lookupPhone}
                    onChange={(e) => setLookupPhone(e.target.value)}
                  />
                </label>
              </div>
              {lookupError && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{lookupError}</p>
              )}
              <button type="submit" disabled={lookupLoading} className="btn btn-navy w-full disabled:opacity-60">
                <Search size={16} /> {lookupLoading ? 'Checking...' : 'Check Status'}
              </button>
            </form>

            {lookupResult && statusMeta && (
              <div className="rounded-2xl border border-navy-100 bg-navy-50/70 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-bold text-slate-500">{lookupResult.referenceCode}</p>
                    <h3 className="text-xl font-extrabold text-navy-900">{lookupResult.childName}</h3>
                  </div>
                  <span className={`rounded-full border px-3.5 py-1 text-xs font-extrabold ${statusMeta.badge}`}>
                    {statusMeta.label}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{statusMeta.desc}</p>
                <div className="mt-4 grid gap-2 border-t border-navy-100 pt-4 text-sm sm:grid-cols-2">
                  <p><span className="font-bold text-navy-900">Program:</span> {lookupResult.program}</p>
                  <p><span className="font-bold text-navy-900">Branch:</span> {lookupResult.branch}</p>
                  {lookupResult.email && (
                    <p className="sm:col-span-2">
                      <span className="font-bold text-navy-900">Notification Email:</span> {lookupResult.email}
                    </p>
                  )}
                  <p>
                    <span className="font-bold text-navy-900">Submitted:</span>{' '}
                    {new Date(lookupResult.createdAt).toLocaleDateString('en-PH')}
                  </p>
                  {lookupResult.reviewedAt && (
                    <p>
                      <span className="font-bold text-navy-900">Reviewed:</span>{' '}
                      {new Date(lookupResult.reviewedAt).toLocaleDateString('en-PH')}
                    </p>
                  )}
                </div>
                {lookupResult.adminNotes && (
                  <div className="mt-4 rounded-xl bg-white p-3 text-sm">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Admin Remarks</p>
                    <p className="mt-1 text-slate-700">{lookupResult.adminNotes}</p>
                  </div>
                )}

                {lookupResult.paymentChannels && (
                  <div className="mt-4 rounded-2xl border border-gold-400 bg-gold-50 p-4 text-sm">
                    <p className="flex items-center gap-2 font-extrabold text-navy-900">
                      <CreditCard size={16} className="text-gold-600" /> Where to Send Enrollment Payment
                    </p>
                    <ul className="mt-2 space-y-1.5 text-slate-700">
                      <li>
                        <strong>GCash:</strong> {lookupResult.paymentChannels.gcashName} &mdash;{' '}
                        <strong>{lookupResult.paymentChannels.gcashNumber}</strong>
                      </li>
                      <li>
                        <strong>Bank Transfer ({lookupResult.paymentChannels.bankName}):</strong>{' '}
                        {lookupResult.paymentChannels.bankAccountName} &mdash; Acct #{' '}
                        <strong>{lookupResult.paymentChannels.bankAccountNumber}</strong>
                      </li>
                      <li>
                        <strong>On-Site Cashier:</strong> {lookupResult.paymentChannels.onsiteLocation}
                      </li>
                    </ul>
                    <p className="mt-2.5 text-xs text-slate-600">
                      Include Reference Code <strong>{lookupResult.referenceCode}</strong> and send your payment receipt to{' '}
                      <strong>{lookupResult.paymentChannels.contactEmail}</strong>.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </>
  )
}
