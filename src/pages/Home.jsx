import { Link } from 'react-router-dom'
import { ArrowRight, Heart, Palette, ShieldCheck, Users } from 'lucide-react'
import { SCHOOL, BRANCHES, PROGRAMS, VALUES } from '../lib/data.js'
import BranchCard from '../components/BranchCard.jsx'

const icons = [Heart, Palette, ShieldCheck, Users]

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="dots-bg absolute inset-0 opacity-30" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="inline-block rounded-full bg-gold-500 px-4 py-1 text-sm font-extrabold text-navy-950">
              Est. {SCHOOL.established}
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl">
              Welcome to <span className="text-gold-400">{SCHOOL.name}</span> {SCHOOL.suffix}
            </h1>
            <p className="mt-5 max-w-lg text-lg text-white/85">{SCHOOL.tagline} We offer Nursery, Pre-Kindergarten and Kindergarten in a caring, playful environment.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/enroll" className="btn btn-gold">Enroll Your Child <ArrowRight size={18} /></Link>
              <Link to="/programs" className="btn btn-outline">Our Programs</Link>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="rounded-full bg-gold-500/20 p-6">
              <img src="./logo.jpg" alt="School logo" className="h-64 w-64 rounded-full shadow-2xl sm:h-80 sm:w-80" />
            </div>
          </div>
        </div>
        <div className="h-2 bg-gold-500" />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold text-navy-900">Our Programs</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">Early childhood education designed for every stage of your little one&rsquo;s growth.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PROGRAMS.map((p) => (
            <div key={p.id} className={`rounded-3xl p-6 ${p.color === 'navy' ? 'bg-navy-900 text-white' : 'bg-gold-50 text-navy-900'}`}>
              <p className={`text-sm font-extrabold ${p.color === 'navy' ? 'text-gold-400' : 'text-gold-600'}`}>{p.age}</p>
              <h3 className="mt-1 text-2xl font-extrabold">{p.name}</h3>
              <p className={`mt-3 ${p.color === 'navy' ? 'text-white/80' : 'text-slate-600'}`}>{p.blurb}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/programs" className="btn btn-navy">See Program Details</Link>
        </div>
      </section>

      <section className="bg-navy-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-extrabold text-navy-900">Why Families Choose Us</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => {
              const Icon = icons[i]
              return (
                <div key={v.title} className="rounded-3xl bg-white p-6 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-100 text-gold-600">
                    <Icon />
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold text-navy-900">{v.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{v.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold text-navy-900">Our Branches</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {BRANCHES.map((b) => <BranchCard key={b.id} branch={b} />)}
        </div>
      </section>

      <section className="bg-gold-500 py-14 text-center">
        <h2 className="text-3xl font-extrabold text-navy-950">Ready to begin the adventure?</h2>
        <p className="mt-2 text-navy-900">Send an enrollment inquiry today and we will get in touch with you.</p>
        <Link to="/enroll" className="btn btn-navy mt-6">Start Enrollment</Link>
      </section>
    </>
  )
}
