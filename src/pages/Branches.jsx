import PageHeader from '../components/PageHeader.jsx'
import BranchCard from '../components/BranchCard.jsx'
import { BRANCHES } from '../lib/data.js'

export default function Branches() {
  return (
    <>
      <PageHeader title="Our Branches" subtitle="Find a Keziah's Learning Hub near you" />
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-2">
        {BRANCHES.map((b) => <BranchCard key={b.id} branch={b} />)}
      </section>
    </>
  )
}
