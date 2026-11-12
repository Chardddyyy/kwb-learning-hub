import { Award, Building2, CheckCircle2, Clock, TrendingUp, Users, XCircle } from 'lucide-react'

const STATUS_COLORS = [
  { key: 'pending', label: 'Pending', color: '#f59e0b', dot: 'bg-amber-500' },
  { key: 'approved', label: 'Approved', color: '#10b981', dot: 'bg-emerald-500' },
  { key: 'contacted', label: 'Contacted', color: '#0ea5e9', dot: 'bg-sky-500' },
  { key: 'enrolled', label: 'Enrolled', color: '#0a1272', dot: 'bg-navy-900' },
  { key: 'declined', label: 'Declined', color: '#f43f5e', dot: 'bg-rose-500' },
]

function KpiCard({ title, value, subtitle, Icon, tone }) {
  const styles = {
    navy: 'bg-gradient-to-br from-navy-900 to-navy-950 text-white border-navy-900',
    amber: 'bg-white text-navy-900 border-amber-300 ring-2 ring-amber-100',
    emerald: 'bg-white text-navy-900 border-navy-100',
    gold: 'bg-white text-navy-900 border-gold-400/60',
    rose: 'bg-white text-navy-900 border-navy-100',
  }
  const iconBox = {
    navy: 'bg-white/15 text-gold-400',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    gold: 'bg-gold-100 text-gold-600',
    rose: 'bg-rose-100 text-rose-700',
  }

  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${styles[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-extrabold uppercase tracking-wider ${tone === 'navy' ? 'text-white/75' : 'text-slate-500'}`}>
            {title}
          </p>
          <p className="mt-2 font-display text-3xl font-extrabold">{value}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBox[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
      {subtitle && (
        <p className={`mt-2 text-xs font-semibold ${tone === 'navy' ? 'text-gold-400' : 'text-slate-500'}`}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

function StatusDonut({ summary }) {
  const total = summary.total || 0
  const radius = 44
  const circumference = 2 * Math.PI * radius
  let cumulative = 0

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#e4e7fb" strokeWidth="16" />
          {total > 0 &&
            STATUS_COLORS.map(({ key, color }) => {
              const val = summary[key] || 0
              if (val === 0) return null
              const dash = (val / total) * circumference
              const offset = -cumulative
              cumulative += dash
              return (
                <circle
                  key={key}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth="16"
                  strokeDasharray={`${dash} ${circumference}`}
                  strokeDashoffset={offset}
                />
              )
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-2xl font-extrabold text-navy-900">{total}</span>
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Total</span>
        </div>
      </div>

      <ul className="w-full space-y-2 text-sm">
        {STATUS_COLORS.map(({ key, label, dot }) => {
          const val = summary[key] || 0
          const pct = total > 0 ? Math.round((val / total) * 100) : 0
          return (
            <li key={key} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-semibold text-slate-700">
                <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                {label}
              </span>
              <span className="font-bold text-navy-900">
                {val} <span className="text-xs font-normal text-slate-400">({pct}%)</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function DailyTrendChart({ dailyTrend }) {
  const maxVal = Math.max(1, ...dailyTrend.map((d) => d.total))

  return (
    <div className="flex h-48 flex-col justify-between">
      <div className="flex flex-1 items-end gap-2 border-b border-navy-100 pb-3 pt-4">
        {dailyTrend.map((d) => {
          const totalHeight = Math.round((d.total / maxVal) * 100)
          const approvedHeight = d.total > 0 ? Math.round((d.approved / d.total) * totalHeight) : 0
          return (
            <div key={d.date} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-[11px] font-extrabold text-navy-900 opacity-80 group-hover:opacity-100">
                {d.total > 0 ? d.total : ''}
              </span>
              <div
                title={`${d.date}: ${d.total} applications (${d.approved} approved+)`}
                className="relative flex w-full max-w-8 flex-col justify-end overflow-hidden rounded-t-lg bg-navy-100"
                style={{ height: `${Math.max(d.total > 0 ? 12 : 4, totalHeight)}%` }}
              >
                {d.approved > 0 && (
                  <div
                    className="w-full bg-gold-500 transition-all"
                    style={{ height: `${Math.round((approvedHeight / Math.max(totalHeight, 1)) * 100)}%` }}
                  />
                )}
                {d.total > d.approved && (
                  <div className="w-full flex-1 bg-navy-800" />
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-center">
        {dailyTrend.map((d) => (
          <span key={d.date} className="flex-1 text-[11px] font-bold text-slate-500">
            {d.label}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-navy-800" /> Submitted</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gold-500" /> Approved+</span>
      </div>
    </div>
  )
}

/** Visual KPI summary cards and enrollment analytics charts backed by MySQL data. */
export default function AnalyticsPanel({ analytics, showCharts = true }) {
  if (!analytics) return null

  const { summary, byProgram, byBranch, dailyTrend } = analytics
  const approvedTotal = (summary.approved || 0) + (summary.contacted || 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Total Applications"
          value={summary.total}
          subtitle={`${summary.reviewed} reviewed by staff`}
          Icon={Users}
          tone="navy"
        />
        <KpiCard
          title="Pending Approval"
          value={summary.pending}
          subtitle={summary.pending > 0 ? 'Needs admin review' : 'All caught up'}
          Icon={Clock}
          tone="amber"
        />
        <KpiCard
          title="Approved"
          value={approvedTotal}
          subtitle={`${summary.approvalRate}% approval rate`}
          Icon={CheckCircle2}
          tone="emerald"
        />
        <KpiCard
          title="Enrolled"
          value={summary.enrolled}
          subtitle={`${summary.enrollmentRate}% conversion rate`}
          Icon={Award}
          tone="gold"
        />
        <KpiCard
          title="Declined"
          value={summary.declined}
          subtitle="Rejected applications"
          Icon={XCircle}
          tone="rose"
        />
      </div>

      {showCharts && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-extrabold text-navy-900">7-Day Application Trend</h3>
                <p className="text-xs text-slate-500">Daily inquiries &amp; approvals</p>
              </div>
              <TrendingUp size={18} className="text-gold-600" />
            </div>
            <div className="mt-4">
              <DailyTrendChart dailyTrend={dailyTrend} />
            </div>
          </div>

          <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-extrabold text-navy-900">By Program</h3>
                <p className="text-xs text-slate-500">Distribution across grade levels</p>
              </div>
              <Award size={18} className="text-gold-600" />
            </div>
            <div className="mt-5 space-y-4">
              {byProgram.map((p) => {
                const pct = summary.total > 0 ? Math.round((p.total / summary.total) * 100) : 0
                return (
                  <div key={p.program}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-bold text-navy-900">{p.program}</span>
                      <span className="text-xs font-bold text-slate-500">
                        {p.total} <span className="text-slate-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-navy-50">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-navy-800 to-gold-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 flex gap-3 text-[11px] font-semibold text-slate-500">
                      <span>Pending: {p.pending}</span>
                      <span>Approved+: {p.approved}</span>
                      <span>Enrolled: {p.enrolled}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-extrabold text-navy-900">Status &amp; Branches</h3>
                <p className="text-xs text-slate-500">Approval share &amp; campus split</p>
              </div>
              <Building2 size={18} className="text-gold-600" />
            </div>
            <div className="mt-4">
              <StatusDonut summary={summary} />
            </div>
            <div className="mt-5 space-y-2 border-t border-navy-100 pt-4">
              {byBranch.map((b) => (
                <div key={b.branch} className="flex items-center justify-between rounded-xl bg-navy-50/70 px-3 py-2 text-xs">
                  <span className="truncate font-bold text-navy-900">{b.branch}</span>
                  <span className="shrink-0 font-extrabold text-gold-600">
                    {b.total} total · {b.approved} approved+
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

