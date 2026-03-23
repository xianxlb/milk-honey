import type { Metadata, Viewport } from 'next'
import Providers from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Honey Milk',
  description: 'Build your village while earning yield',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#5B9BD5',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased max-w-md mx-auto">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
