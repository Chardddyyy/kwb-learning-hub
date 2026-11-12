import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { login, isLoggedIn } from '../../lib/store.js'

export default function AdminLogin() {
  const nav = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isLoggedIn()) nav('/admin/dashboard', { replace: true })
  }, [nav])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (await login(username, password)) nav('/admin/dashboard')
      else setError('Incorrect username or password.')
    } catch (err) {
      setError(err.message || 'Incorrect username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
        <img src="./logo.jpg" alt="School logo" className="mx-auto h-24 w-24 rounded-full" />
        <h1 className="mt-4 text-center text-2xl font-extrabold text-navy-900">Staff Login</h1>
        <p className="text-center text-sm text-slate-500">Enrollment records system</p>
        <div className="mt-6 space-y-4">
          <input className="field" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input className="field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-sm font-bold text-red-600">{error}</p>}
          <button disabled={loading} className="btn btn-navy w-full disabled:opacity-60">
            <Lock size={16} /> {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
        <Link to="/" className="mt-5 block text-center text-sm font-bold text-gold-600 hover:underline">Back to website</Link>
      </form>
    </div>
  )
}
