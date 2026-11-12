import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Check,
  Clock,
  Download,
  ExternalLink,
  Eye,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import AnalyticsPanel from '../../components/admin/AnalyticsPanel.jsx'
import ReviewModal from '../../components/admin/ReviewModal.jsx'
import { BRANCHES, PROGRAMS } from '../../lib/data.js'
import {
  getAdminUser,
  getAnalytics,
  getEnrollments,
  getPaymentConfig,
  isLoggedIn,
  logout,
  removeEnrollment,
  reviewEnrollment,
  toCSV,
} from '../../lib/store.js'

const STATUS_BADGES = {
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Contacted: 'bg-sky-100 text-sky-800 border-sky-200',
  Enrolled: 'bg-navy-900 text-white border-navy-900',
  Declined: 'bg-rose-100 text-rose-800 border-rose-200',
}

const FILTER_STATUSES = ['All', 'Pending', 'Approved', 'Contacted', 'Enrolled', 'Declined']

export default function AdminDashboard() {
  const nav = useNavigate()
  const [rows, setRows] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [paymentConfig, setPaymentConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [tab, setTab] = useState('overview')
  const [statusFilter, setStatusFilter] = useState('All')
  const [program, setProgram] = useState('All')
  const [branch, setBranch] = useState('All')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(null)

  const adminUser = getAdminUser()

  const handleAuthError = useCallback(
    (err) => {
      if (err.status === 401) {
        logout()
        nav('/admin', { replace: true })
        return true
      }
      return false
    },
    [nav],
  )

  const refresh = useCallback(async () => {
    setError('')
    try {
      const [list, stats, payCfg] = await Promise.all([
        getEnrollments(),
        getAnalytics(),
        getPaymentConfig(),
      ])
      setRows(list)
      setAnalytics(stats)
      setPaymentConfig(payCfg)
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err.message || 'Failed to load dashboard data.')
      }
    } finally {
      setLoading(false)
    }
  }, [handleAuthError])

  useEffect(() => {
    if (isLoggedIn()) refresh()
  }, [refresh])

  const effectiveStatus = tab === 'pending' ? 'Pending' : statusFilter

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (effectiveStatus === 'All' || r.status === effectiveStatus) &&
          (program === 'All' || r.program === program) &&
          (branch === 'All' || r.branch === branch) &&
          `${r.referenceCode} ${r.childName} ${r.parentName} ${r.phone} ${r.email}`
            .toLowerCase()
            .includes(q.toLowerCase()),
      ),
    [rows, effectiveStatus, program, branch, q],
  )

  if (!isLoggedIn()) return <Navigate to="/admin" replace />

  const statusCounts = {
    All: rows.length,
    Pending: rows.filter((r) => r.status === 'Pending').length,
    Approved: rows.filter((r) => r.status === 'Approved').length,
    Contacted: rows.filter((r) => r.status === 'Contacted').length,
    Enrolled: rows.filter((r) => r.status === 'Enrolled').length,
    Declined: rows.filter((r) => r.status === 'Declined').length,
  }

  const handleReview = async (id, payload) => {
    setBusyId(id)
    setError('')
    setNotice('')
    try {
      const updated = await reviewEnrollment(id, payload)
      setSelected(null)
      const note = updated?.emailNotification
      if (note && !note.skipped) {
        setNotice(
          note.deliveryStatus === 'sent'
            ? `Updated to ${updated.status}. Email update with payment info sent to ${note.recipientEmail}.`
            : `Updated to ${updated.status}. Email update logged in email_logs for ${note.recipientEmail} (configure SMTP in server/.env for live inbox delivery).`,
        )
      } else {
        setNotice(`Application updated to ${updated.status}.`)
      }
      await refresh()
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err.message || 'Failed to update enrollment approval.')
      }
    } finally {
      setBusyId('')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this enrollment record permanently?')) return
    setBusyId(id)
    setError('')
    try {
      await removeEnrollment(id)
      await refresh()
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err.message || 'Failed to delete record.')
      }
    } finally {
      setBusyId('')
    }
  }

  const exportCSV = () => {
    const blob = new Blob([toCSV(filtered)], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'enrollment-records.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="min-h-screen bg-navy-50/70">
      <header className="sticky top-0 z-30 border-b-4 border-gold-500 bg-navy-950 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <img src="./logo.jpg" alt="School logo" className="h-11 w-11 rounded-full ring-2 ring-gold-500" />
            <div>
              <p className="font-display text-base font-extrabold leading-tight sm:text-lg">
                Keziah&rsquo;s Whimsical Beginning
              </p>
              <p className="text-xs font-bold tracking-wider text-gold-400">
                ADMIN APPROVAL &amp; ANALYTICS PORTAL
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/90 sm:inline-flex">
              <ShieldCheck size={14} className="text-gold-400" />
              {adminUser.fullName || adminUser.username}
            </span>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/10"
            >
              <ExternalLink size={14} /> Website
            </Link>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/10"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-gold-500 px-4 py-2 text-xs font-extrabold text-navy-950 transition hover:bg-gold-400"
              onClick={() => { logout(); nav('/admin') }}
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>

        <div className="border-t border-white/10 bg-navy-900/90">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2.5 sm:px-6">
            <button
              type="button"
              onClick={() => setTab('overview')}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-xs font-extrabold transition ${
                tab === 'overview' ? 'bg-gold-500 text-navy-950' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <LayoutDashboard size={14} /> Overview
            </button>
            <button
              type="button"
              onClick={() => setTab('pending')}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-xs font-extrabold transition ${
                tab === 'pending' ? 'bg-gold-500 text-navy-950' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <Clock size={14} /> Pending Approval
              {statusCounts.Pending > 0 && (
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-extrabold text-navy-950">
                  {statusCounts.Pending}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setTab('analytics')}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-xs font-extrabold transition ${
                tab === 'analytics' ? 'bg-gold-500 text-navy-950' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <BarChart3 size={14} /> Analytics
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5 text-sm font-bold text-rose-800">
            {error}
          </div>
        )}

        {notice && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-bold text-emerald-900">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice('')} className="text-emerald-700 hover:text-emerald-950">
              <X size={16} />
            </button>
          </div>
        )}

        {paymentConfig && !paymentConfig.smtpConfigured && (
          <div className="rounded-2xl border border-navy-100 bg-white px-5 py-3.5 text-xs text-slate-600 shadow-xs">
            <span className="font-extrabold text-navy-900">Email Delivery Mode:</span> Approval &amp; payment emails are
            currently saved in MySQL <code className="font-mono text-navy-900">email_logs</code> (viewable inside{' '}
            <strong>Review</strong>). To send directly to parent inboxes, add <code className="font-mono">SMTP_USER</code>{' '}
            and <code className="font-mono">SMTP_PASS</code> in <code className="font-mono">server/.env</code>.
          </div>
        )}

        {statusCounts.Pending > 0 && tab !== 'pending' && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200/80 text-amber-900">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-navy-900">
                  {statusCounts.Pending} enrollment {statusCounts.Pending === 1 ? 'application' : 'applications'} awaiting admin approval
                </p>
                <p className="text-xs text-slate-600">
                  Applications stay in Pending status until reviewed and approved by an administrator.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTab('pending')}
              className="rounded-full bg-navy-900 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-navy-700"
            >
              Review Pending Queue
            </button>
          </div>
        )}

        {(tab === 'overview' || tab === 'analytics') && (
          <AnalyticsPanel analytics={analytics} showCharts />
        )}

        {tab !== 'analytics' && (
          <section className="rounded-3xl border border-navy-100 bg-white shadow-sm">
            <div className="border-b border-navy-100 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-extrabold text-navy-900">
                    {tab === 'pending' ? 'Pending Approval Queue' : 'Enrollment Applications'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {tab === 'pending'
                      ? 'Approve or decline newly submitted enrollment inquiries.'
                      : 'Review, approve, filter, and export all enrollment applications.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-navy py-2.5 text-xs"
                  onClick={exportCSV}
                  disabled={!filtered.length}
                >
                  <Download size={15} /> Export CSV ({filtered.length})
                </button>
              </div>

              {tab === 'overview' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {FILTER_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition ${
                        statusFilter === s
                          ? 'border-navy-900 bg-navy-900 text-white'
                          : 'border-navy-100 bg-navy-50/70 text-navy-900 hover:bg-navy-100'
                      }`}
                    >
                      {s}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                          statusFilter === s ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
                        }`}
                      >
                        {statusCounts[s]}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative sm:col-span-2">
                  <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    className="field pl-10 text-sm"
                    placeholder="Search reference code, child, parent, phone or email..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                <select className="field text-sm" value={program} onChange={(e) => setProgram(e.target.value)}>
                  <option value="All">All Programs</option>
                  {PROGRAMS.map((p) => <option key={p.id}>{p.name}</option>)}
                </select>
                <select className="field text-sm" value={branch} onChange={(e) => setBranch(e.target.value)}>
                  <option value="All">All Branches</option>
                  {BRANCHES.map((b) => <option key={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-left text-sm">
                <thead className="bg-navy-50/90 text-xs uppercase tracking-wider text-navy-900">
                  <tr>
                    <th className="px-5 py-3.5 font-extrabold">Ref &amp; Date</th>
                    <th className="px-5 py-3.5 font-extrabold">Child</th>
                    <th className="px-5 py-3.5 font-extrabold">Program &amp; Branch</th>
                    <th className="px-5 py-3.5 font-extrabold">Parent &amp; Contact</th>
                    <th className="px-5 py-3.5 font-extrabold">Status</th>
                    <th className="px-5 py-3.5 text-right font-extrabold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {loading && (
                    <tr>
                      <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                        Loading enrollment applications...
                      </td>
                    </tr>
                  )}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                        No enrollment records match the current filter.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    filtered.map((r) => (
                      <tr key={r.id} className="align-top transition hover:bg-navy-50/40">
                        <td className="px-5 py-4">
                          <p className="font-mono text-xs font-extrabold text-navy-900">{r.referenceCode || '—'}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {new Date(r.createdAt).toLocaleDateString('en-PH')}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-extrabold text-navy-900">{r.childName}</p>
                          <p className="mt-0.5 text-xs text-slate-500">Born {r.birthdate}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-block rounded-lg bg-gold-100 px-2.5 py-0.5 text-xs font-extrabold text-navy-900">
                            {r.program}
                          </span>
                          <p className="mt-1 text-xs text-slate-600">{r.branch}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-navy-900">{r.parentName}</p>
                          <p className="text-xs text-slate-600">{r.phone}</p>
                          {r.email && <p className="text-xs text-slate-400">{r.email}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${
                              STATUS_BADGES[r.status] || STATUS_BADGES.Pending
                            }`}
                          >
                            {r.status}
                          </span>
                          {r.reviewedBy && (
                            <p className="mt-1 text-[11px] text-slate-400">by {r.reviewedBy}</p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.status === 'Pending' && (
                              <>
                                <button
                                  type="button"
                                  disabled={busyId === r.id}
                                  title="Approve Application"
                                  onClick={() => handleReview(r.id, { status: 'Approved' })}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-extrabold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  <Check size={14} /> Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={busyId === r.id}
                                  title="Decline Application"
                                  onClick={() => handleReview(r.id, { status: 'Declined' })}
                                  className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-extrabold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                                >
                                  <X size={14} /> Decline
                                </button>
                              </>
                            )}
                            {(r.status === 'Approved' || r.status === 'Contacted') && (
                              <button
                                type="button"
                                disabled={busyId === r.id}
                                title="Mark as Enrolled"
                                onClick={() => handleReview(r.id, { status: 'Enrolled' })}
                                className="inline-flex items-center gap-1 rounded-lg bg-navy-900 px-2.5 py-1.5 text-xs font-extrabold text-white transition hover:bg-navy-700 disabled:opacity-50"
                              >
                                <GraduationCap size={14} /> Enroll
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelected(r)}
                              title="Review details & remarks"
                              className="inline-flex items-center gap-1 rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-xs font-bold text-navy-900 transition hover:bg-navy-50"
                            >
                              <Eye size={14} /> Review
                            </button>
                            <button
                              type="button"
                              disabled={busyId === r.id}
                              aria-label="Delete record"
                              title="Delete record"
                              onClick={() => handleDelete(r.id)}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      <ReviewModal
        key={selected?.id || 'closed'}
        record={selected}
        busy={Boolean(selected && busyId === selected.id)}
        smtpConfigured={Boolean(paymentConfig?.smtpConfigured)}
        onClose={() => setSelected(null)}
        onReview={handleReview}
      />
    </div>
  )
}
