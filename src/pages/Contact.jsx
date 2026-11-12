import { Mail, MapPin, Phone } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import { SCHOOL, BRANCHES } from '../lib/data.js'

export default function Contact() {
  const items = [
    { Icon: MapPin, label: 'Address', value: BRANCHES[0].address },
    { Icon: Phone, label: 'Phone', value: SCHOOL.phone },
    { Icon: Mail, label: 'Email', value: SCHOOL.email },
  ]
  return (
    <>
      <PageHeader title="Contact Us" subtitle="We would love to hear from you" />
      <section className="mx-auto grid max-w-4xl gap-6 px-4 py-16 sm:grid-cols-3">
        {items.map(({ Icon, label, value }) => (
          <div key={label} className="rounded-3xl bg-navy-50 p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-500 text-navy-950">
              <Icon />
            </div>
            <h3 className="mt-4 text-lg font-extrabold text-navy-900">{label}</h3>
            <p className="mt-1 break-words text-sm text-slate-600">{value}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-4xl px-4 pb-16">
        <div className="rounded-3xl bg-navy-900 p-8 text-center text-white">
          <h3 className="text-2xl font-extrabold text-gold-400">Office Hours</h3>
          <p className="mt-2">{BRANCHES[0].hours}</p>
        </div>
      </section>
    </>
  )
}
