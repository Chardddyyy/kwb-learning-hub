import { Clock, MapPin, Sparkles } from 'lucide-react'

export default function BranchCard({ branch }) {
  const soon = branch.status === 'soon'
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-navy-100 bg-white p-6 shadow-sm">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${
          soon ? 'bg-gold-100 text-gold-600' : 'bg-navy-900 text-white'
        }`}
      >
        {soon && <Sparkles size={14} />}
        {soon ? 'SOON TO OPEN' : 'NOW OPEN'}
      </span>
      <h3 className="mt-4 text-2xl font-extrabold text-navy-900">{branch.name}</h3>
      <p className="mt-2 text-slate-600">{branch.description}</p>
      <ul className="mt-4 space-y-2 text-sm text-navy-900">
        <li className="flex gap-2"><MapPin size={18} className="shrink-0 text-gold-600" />{branch.address}</li>
        <li className="flex gap-2"><Clock size={18} className="shrink-0 text-gold-600" />{branch.hours}</li>
      </ul>
      {soon && (
        <div className="absolute -right-8 top-6 rotate-45 bg-gold-500 px-10 py-1 text-xs font-extrabold text-navy-950">
          COMING SOON
        </div>
      )}
    </div>
  )
}
