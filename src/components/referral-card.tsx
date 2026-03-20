'use client'

import { Share2, Copy, Check, Pencil } from 'lucide-react'
import { useState } from 'react'

export interface ReferralCardData {
  farmCode: string | null
  farmName: string
  yieldEarnedUsdc: number
  apyPercent: number
  cardCount: number
}

interface ReferralCardProps {
  data: ReferralCardData
  showShareButton?: boolean
  appUrl?: string
  onNameSave?: (name: string) => Promise<void>
}

export function ReferralCard({ data, showShareButton = false, appUrl = 'https://milk-honey-eight.vercel.app', onNameSave }: ReferralCardProps) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(data.farmName)
  const [saving, setSaving] = useState(false)

  const shareUrl = `${appUrl}/farm/${data.farmCode}`
  const shareText = `I'm saving with Milk & Honey and earning real returns 🍯 Check out my farm:`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText, url: shareUrl })
      } catch {
        // User cancelled
      }
    } else {
      await handleCopy()
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard not available
    }
  }

  const handleNameSave = async () => {
    if (!onNameSave || !nameInput.trim()) return
    setSaving(true)
    try {
      await onNameSave(nameInput.trim())
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const yieldDollars = data.yieldEarnedUsdc / 1_000_000

  return (
    <div className="bg-[#FBF8F2] rounded-3xl overflow-hidden shadow-lg border-2 border-[#1A1A1A]/8">
      {/* Green header */}
      <div className="bg-[#6CB4E8] px-6 py-5">
        <div className="flex items-start gap-2 mb-1">
          <span className="text-2xl mt-0.5">🌾</span>
          <div className="flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') setEditing(false) }}
                  className="flex-1 text-lg font-bold text-[#1A1A1A] bg-white/90 rounded-lg px-3 py-1 outline-none"
                  style={{ fontFamily: 'Fredoka' }}
                  disabled={saving}
                />
                <button
                  onClick={handleNameSave}
                  disabled={saving}
                  className="text-white/90 text-sm font-bold bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30 transition-all"
                >
                  {saving ? '…' : 'Save'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                  {data.farmName}&apos;s Farm
                </h2>
                {onNameSave && (
                  <button
                    onClick={() => { setNameInput(data.farmName); setEditing(true) }}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            <p className="text-sm text-white/70 font-medium mt-0.5">
              Public · {data.farmCode ?? '…'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="divide-y divide-[#1A1A1A]/5">
        <div className="px-6 py-4 flex items-center justify-between">
          <span className="text-sm text-[#1A1A1A]/50 font-medium">Interest earned</span>
          <span className="text-sm font-bold" style={{ color: '#F0C430' }}>
            ${yieldDollars.toFixed(2)}
          </span>
        </div>
        <div className="px-6 py-4 flex items-center justify-between">
          <span className="text-sm text-[#1A1A1A]/50 font-medium">APY</span>
          <span className="text-sm font-bold text-[#1A1A1A]">
            {data.apyPercent > 0 ? `${data.apyPercent.toFixed(2)}%` : '…'}
          </span>
        </div>
        <div className="px-6 py-4 flex items-center justify-between">
          <span className="text-sm text-[#1A1A1A]/50 font-medium">Crew members</span>
          <span className="text-sm font-bold text-[#1A1A1A]">{data.cardCount}</span>
        </div>
      </div>

      {/* Share buttons */}
      {showShareButton && data.farmCode && (
        <div className="px-6 pb-6 pt-4 flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#F0C430] text-[#1A1A1A] font-bold text-sm border-2 border-[#1A1A1A]/10 hover:shadow-md active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            Share farm
          </button>
          <button
            onClick={handleCopy}
            className="w-12 flex items-center justify-center rounded-2xl bg-[#F5F0E8] border-2 border-[#1A1A1A]/10 text-[#1A1A1A]/60 hover:border-[#F0C430]/60 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  )
}
