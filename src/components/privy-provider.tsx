'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana'
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit'

const solanaConnectors = toSolanaWalletConnectors()

// Lazy browser-only init — keeps Helius API key off the client
let solanaRpc: ReturnType<typeof createSolanaRpc> | undefined
let solanaRpcSubscriptions: ReturnType<typeof createSolanaRpcSubscriptions> | undefined

if (typeof window !== 'undefined') {
  const rpcUrl = `${window.location.origin}/api/rpc`
  const wsUrl = process.env.NEXT_PUBLIC_SOLANA_WS_URL || 'wss://api.mainnet-beta.solana.com'
  solanaRpc = createSolanaRpc(rpcUrl)
  solanaRpcSubscriptions = createSolanaRpcSubscriptions(wsUrl)
}

export function AppPrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ['apple', 'google', 'wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#6CB4E8',
          walletChainType: 'solana-only',
          walletList: ['detected_solana_wallets', 'wallet_connect_qr_solana'],
        },
        embeddedWallets: {
          solana: { createOnLogin: 'users-without-wallets' },
        },
        walletConnectCloudProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
        externalWallets: {
          solana: { connectors: solanaConnectors },
        },
        solana: {
          rpcs: {
            'solana:mainnet': {
              rpc: solanaRpc!,
              rpcSubscriptions: solanaRpcSubscriptions!,
            },
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}
