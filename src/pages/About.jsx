import PageHeader from '../components/PageHeader.jsx'
import { SCHOOL, VALUES } from '../lib/data.js'

export default function About() {
  return (
    <>
      <PageHeader title="About Us" subtitle={`Established ${SCHOOL.established} in Naic, Cavite`} />
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2">
        <img src="./logo.jpg" alt="School logo" className="mx-auto h-72 w-72 rounded-full shadow-xl" />
        <div>
          <h2 className="text-3xl font-extrabold text-navy-900">Our Story</h2>
          <p className="mt-4 text-slate-600">
            {SCHOOL.fullName} began in {SCHOOL.established} with one simple dream: to give every child a joyful and
            confident start to learning. The letter K in our logo stands for Keziah, the inspiration behind our school,
            and for the kindness, curiosity and care we bring to every classroom.
          </p>
          <p className="mt-4 text-slate-600">
            We serve children in Nursery, Pre-Kindergarten and Kindergarten, guiding them through play, stories,
            songs and hands-on activities that build strong foundations for the years ahead.
          </p>
        </div>
      </section>

      <section className="bg-navy-50 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-2">
          <div className="rounded-3xl bg-navy-900 p-8 text-white">
            <h3 className="text-2xl font-extrabold text-gold-400">Our Mission</h3>
            <p className="mt-3 text-white/85">
              To provide a nurturing, safe and engaging environment where young learners develop academically,
              socially and emotionally through play-based education.
            </p>
          </div>
          <div className="rounded-3xl bg-gold-500 p-8 text-navy-950">
            <h3 className="text-2xl font-extrabold">Our Vision</h3>
            <p className="mt-3">
              A community of confident, curious and caring children who love learning and are ready for every
              new chapter of their lives.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold text-navy-900">Our Core Values</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-3xl border-2 border-gold-400 p-6">
              <h3 className="text-xl font-extrabold text-navy-900">{v.title}</h3>
              <p className="mt-2 text-slate-600">{v.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
