import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppPrivyProvider } from '@/components/privy-provider'

export const metadata: Metadata = {
  title: 'Milk & Honey',
  description: 'Build your village while earning yield',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#6CB4E8',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased max-w-md mx-auto"><AppPrivyProvider>{children}</AppPrivyProvider></body>
    </html>
  )
}
