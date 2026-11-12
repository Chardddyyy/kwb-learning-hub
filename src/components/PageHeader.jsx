export default function PageHeader({ title, subtitle }) {
  return (
    <section className="relative overflow-hidden bg-navy-900 py-16 text-center text-white">
      <div className="dots-bg absolute inset-0 opacity-30" />
      <div className="relative mx-auto max-w-3xl px-4">
        <h1 className="text-4xl font-extrabold sm:text-5xl">{title}</h1>
        <div className="mx-auto mt-4 h-1.5 w-20 rounded-full bg-gold-500" />
        {subtitle && <p className="mt-4 text-lg text-white/80">{subtitle}</p>}
      </div>
    </section>
  )
}
