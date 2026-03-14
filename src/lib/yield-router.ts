import { depositToJupiterLend, withdrawFromJupiterLend, getJupiterLendAPY } from './jupiter-lend'
import { depositToVoltr, withdrawFromVoltr, getVoltrVaultInfo } from './voltr'

export type YieldSource = 'jupiter' | 'voltr'

export function pickBestYieldSource(
  jupiterAPY: number,
  voltrAPY: number | null
): YieldSource {
  if (voltrAPY === null || jupiterAPY >= voltrAPY) return 'jupiter'
  return 'voltr'
}

export async function getBestAPY(): Promise<{ source: YieldSource; apy: number }> {
  const [jupiterAPY, voltrInfo] = await Promise.all([
    getJupiterLendAPY(),
    getVoltrVaultInfo(),
  ])
  const voltrAPY = voltrInfo?.apy ?? null
  const source = pickBestYieldSource(jupiterAPY, voltrAPY)
  return {
    source,
    apy: source === 'jupiter' ? jupiterAPY : (voltrAPY ?? 0),
  }
}

export async function deposit(amountUSDC: number): Promise<{ txSignature: string; source: YieldSource }> {
  const { source } = await getBestAPY()
  const txSignature = source === 'jupiter'
    ? await depositToJupiterLend(amountUSDC)
    : await depositToVoltr(amountUSDC)
  return { txSignature, source }
}

export async function withdraw(amountUSDC: number, source: YieldSource): Promise<string> {
  return source === 'jupiter'
    ? await withdrawFromJupiterLend(amountUSDC)
    : await withdrawFromVoltr(amountUSDC)
}
