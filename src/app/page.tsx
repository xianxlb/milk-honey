'use client'

import ProsperityBar from '@/components/ProsperityBar'
import RentBanner from '@/components/RentBanner'
import CityView from '@/components/CityView'
import { useRentCollection } from '@/hooks/useRentCollection'
import { useYieldSync } from '@/hooks/useYieldSync'

export default function Home() {
  const { yieldSinceLastVisit } = useRentCollection()
  useYieldSync()

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 to-green-50 flex flex-col max-w-md mx-auto">
      <header className="text-center pt-6 pb-2">
        <h1 className="text-2xl font-bold text-amber-700">🍯 Milk Honey</h1>
      </header>
      <ProsperityBar />
      <RentBanner yieldSinceLastVisit={yieldSinceLastVisit} />
      <CityView />
    </main>
  )
}
