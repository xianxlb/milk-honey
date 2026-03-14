'use client'

import { use } from 'react'
import BuildingDetail from '@/components/BuildingDetail'

export default function BuildingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 to-green-50 max-w-md mx-auto">
      <BuildingDetail buildingId={id} />
    </main>
  )
}
