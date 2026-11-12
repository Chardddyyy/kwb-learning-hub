import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { SCHOOL, BRANCHES } from '../lib/data.js'

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-white">
      <div className="h-1.5 bg-gold-500" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <img src="./logo.jpg" alt="School logo" className="h-14 w-14 rounded-full" />
            <div>
              <p className="font-display font-bold">{SCHOOL.name}</p>
              <p className="text-xs font-bold tracking-widest text-gold-400">LEARNING HUB</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-white/75">{SCHOOL.tagline}</p>
          <p className="mt-2 text-sm text-white/60">Established {SCHOOL.established}</p>
        </div>

        <div>
          <h3 className="font-display text-lg font-bold text-gold-400">Quick Links</h3>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li><Link className="hover:text-gold-400" to="/about">About Us</Link></li>
            <li><Link className="hover:text-gold-400" to="/programs">Programs</Link></li>
            <li><Link className="hover:text-gold-400" to="/branches">Branches</Link></li>
            <li><Link className="hover:text-gold-400" to="/enroll">Enrollment</Link></li>
            <li><Link className="hover:text-gold-400" to="/admin">Staff Login</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg font-bold text-gold-400">Contact</h3>
          <ul className="mt-3 space-y-3 text-sm text-white/80">
            <li className="flex gap-2"><MapPin size={18} className="mt-0.5 shrink-0 text-gold-400" />{BRANCHES[0].address}</li>
            <li className="flex gap-2"><Phone size={18} className="shrink-0 text-gold-400" />{SCHOOL.phone}</li>
            <li className="flex gap-2"><Mail size={18} className="shrink-0 text-gold-400" />{SCHOOL.email}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        &copy; {new Date().getFullYear()} {SCHOOL.fullName}. All rights reserved.
      </div>
    </footer>
  )
}
