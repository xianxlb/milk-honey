'use client'

import { useState } from 'react'
import { useCityStore } from '@/store/city-store'
import { canMergeBuildings } from '@/lib/game-logic'
import BuildingArt from './BuildingArt'
import { BUILDING_TYPES } from '@/lib/constants'

interface MergeModalProps {
  onClose: () => void
}

export default function MergeModal({ onClose }: MergeModalProps) {
  const { buildings, mergeBuildings } = useCityStore()
  const [selected, setSelected] = useState<string[]>([])

  const activeBuildings = buildings.filter(b => b.status === 'active')

  const toggleSelect = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id))
    } else if (selected.length < 2) {
      setSelected([...selected, id])
    } else {
      setSelected([selected[1], id])
    }
  }

  const canMerge =
    selected.length === 2 &&
    canMergeBuildings(
      activeBuildings.find(b => b.id === selected[0])!,
      activeBuildings.find(b => b.id === selected[1])!
    )

  const handleMerge = () => {
    if (!canMerge) return
    mergeBuildings(selected[0], selected[1])
    onClose()
  }

  const selectedBuildings = selected.map(id => activeBuildings.find(b => b.id === id)!).filter(Boolean)
  const mergePreview = canMerge && selectedBuildings.length === 2
    ? {
        type: selectedBuildings[0].type,
        newLevel: selectedBuildings[0].level + 1,
        newValue: selectedBuildings[0].totalValue + selectedBuildings[1].totalValue,
      }
    : null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-md p-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">Merge Buildings</h2>
          <button className="text-gray-400 text-xl" onClick={onClose}>✕</button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Select 2 buildings of the same type and level to merge into a higher level.
        </p>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {activeBuildings.map(b => {
            const isSelected = selected.includes(b.id)
            return (
              <button
                key={b.id}
                className={`p-2 border-2 rounded-xl flex flex-col items-center gap-1 ${
                  isSelected ? 'border-amber-500 bg-amber-50' : 'border-gray-100'
                }`}
                onClick={() => toggleSelect(b.id)}
              >
                <BuildingArt type={b.type} level={b.level} />
                <p className="text-[10px] text-gray-500">L{b.level}</p>
              </button>
            )
          })}
        </div>

        {selected.length === 2 && !canMerge && (
          <p className="text-sm text-red-500 mb-4">
            Buildings must be the same type, same level, and below L8 to merge.
          </p>
        )}

        {mergePreview && (
          <div className="p-3 bg-amber-50 rounded-xl mb-4 text-center">
            <p className="text-sm text-amber-700">
              Merge into <strong>L{mergePreview.newLevel} {BUILDING_TYPES.find(t => t.type === mergePreview.type)?.name}</strong>
            </p>
            <p className="text-xs text-amber-600">${mergePreview.newValue.toFixed(2)} total value</p>
          </div>
        )}

        <button
          className="w-full py-3 bg-amber-500 text-white rounded-xl font-medium disabled:opacity-50 active:bg-amber-600"
          disabled={!canMerge}
          onClick={handleMerge}
        >
          Merge
        </button>
      </div>
    </div>
  )
}
