'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana'
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit'

const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL
if (!rpcUrl) throw new Error('NEXT_PUBLIC_SOLANA_RPC_URL is not set')

const wsUrl = rpcUrl.replace(/^https/, 'wss').replace(/^http/, 'ws')

const solanaConnectors = toSolanaWalletConnectors()
const solanaRpc = createSolanaRpc(rpcUrl)
const solanaRpcSubscriptions = createSolanaRpcSubscriptions(wsUrl)

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
              rpc: solanaRpc,
              rpcSubscriptions: solanaRpcSubscriptions,
            },
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}
