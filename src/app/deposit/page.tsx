import DepositFlow from '@/components/DepositFlow'

export default function DepositPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 to-green-50 max-w-md mx-auto">
      <header className="text-center pt-6 pb-2">
        <h1 className="text-2xl font-bold text-amber-700">🍯 Milk Honey</h1>
      </header>
      <DepositFlow />
    </main>
  )
}
