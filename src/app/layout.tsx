import type { Metadata, Viewport } from 'next'

export const dynamic = 'force-dynamic'
import './globals.css'
import { AppWeb3AuthProvider } from '@/components/web3auth-provider'
import { PortfolioProvider } from '@/contexts/portfolio-context'

export const metadata: Metadata = {
  title: 'Milk & Honey',
  description: 'Gather your crew while earning yield',
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
      <body className="antialiased max-w-md mx-auto"><AppWeb3AuthProvider><PortfolioProvider>{children}</PortfolioProvider></AppWeb3AuthProvider></body>
    </html>
  )
}
