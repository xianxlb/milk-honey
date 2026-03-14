'use client'

import { PrivyProvider } from '@privy-io/react-auth'

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID

export default function Providers({ children }: { children: React.ReactNode }) {
  // Skip Privy during static generation or if not configured
  if (!PRIVY_APP_ID) {
    return <>{children}</>
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#5B9BD5',
        },
        loginMethods: ['email'],
        embeddedWallets: {
          solana: {
            createOnLogin: 'users-without-wallets',
          },
        },
        externalWallets: {
          solana: {
            connectors: undefined,
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}
