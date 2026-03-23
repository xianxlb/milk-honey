'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Plus, Minus, Link as LinkIcon } from 'lucide-react'

const tabs = [
  { label: 'Home',     href: '/',         icon: Home },
  { label: 'Deposit',  href: '/deposit',  icon: Plus },
  { label: 'Withdraw', href: '/withdraw', icon: Minus },
  { label: 'Refer',    href: '/refer',    icon: LinkIcon },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#FBF8F2]/90 backdrop-blur-lg border-t-2 border-[#1A1A1A]/5 px-2 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around py-2">
        {tabs.map(({ label, href, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-all ${
                active
                  ? 'text-[#1A1A1A]'
                  : 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70'
              }`}
            >
              <div className={`w-10 h-8 flex items-center justify-center rounded-xl transition-all ${
                active ? 'bg-[#F0C430]' : ''
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
