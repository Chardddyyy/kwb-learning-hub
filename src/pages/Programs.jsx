import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import { PROGRAMS } from '../lib/data.js'

export default function Programs() {
  return (
    <>
      <PageHeader title="Our Programs" subtitle="Nursery, Pre-Kindergarten and Kindergarten" />
      <section className="mx-auto max-w-6xl space-y-8 px-4 py-16">
        {PROGRAMS.map((p, i) => (
          <article
            key={p.id}
            className={`grid gap-6 rounded-3xl p-8 md:grid-cols-5 ${
              i % 2 === 0 ? 'bg-gold-50' : 'bg-navy-900 text-white'
            }`}
          >
            <div className="md:col-span-2">
              <p className={`text-sm font-extrabold ${i % 2 === 0 ? 'text-gold-600' : 'text-gold-400'}`}>{p.age}</p>
              <h2 className="mt-1 text-3xl font-extrabold">{p.name}</h2>
              <p className={`mt-3 ${i % 2 === 0 ? 'text-slate-600' : 'text-white/80'}`}>{p.blurb}</p>
              <Link to="/enroll" className={`btn mt-5 ${i % 2 === 0 ? 'btn-navy' : 'btn-gold'}`}>Enroll in {p.name}</Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 md:col-span-3">
              {p.skills.map((s) => (
                <li key={s} className={`flex items-start gap-2 rounded-2xl p-4 font-semibold ${i % 2 === 0 ? 'bg-white' : 'bg-white/10'}`}>
                  <CheckCircle2 className={`mt-0.5 shrink-0 ${i % 2 === 0 ? 'text-gold-600' : 'text-gold-400'}`} size={20} />
                  {s}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </>
  )
}
