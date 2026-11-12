import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/programs', label: 'Programs' },
  { to: '/branches', label: 'Branches' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    `rounded-full px-4 py-2 font-bold transition ${
      isActive ? 'bg-navy-900 text-white' : 'text-navy-900 hover:bg-navy-50'
    }`

  return (
    <header className="sticky top-0 z-40 border-b-4 border-gold-500 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img src="./logo.jpg" alt="Keziah's Whimsical Beginning Learning Hub logo" className="h-12 w-12 rounded-full" />
          <div className="leading-tight">
            <p className="font-display text-sm font-extrabold text-navy-900 sm:text-base">
              Keziah&rsquo;s Whimsical Beginning
            </p>
            <p className="text-xs font-bold tracking-widest text-gold-600">LEARNING HUB</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass} end={l.to === '/'}>
              {l.label}
            </NavLink>
          ))}
          <Link to="/enroll" className="btn btn-gold ml-2">
            Enroll Now
          </Link>
        </nav>

        <button
          className="rounded-lg p-2 text-navy-900 lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-navy-100 bg-white px-4 py-3 lg:hidden">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass} end={l.to === '/'} onClick={() => setOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          <Link to="/enroll" className="btn btn-gold mt-2" onClick={() => setOpen(false)}>
            Enroll Now
          </Link>
        </nav>
      )}
    </header>
  )
}
