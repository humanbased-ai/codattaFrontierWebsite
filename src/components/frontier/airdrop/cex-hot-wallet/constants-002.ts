// Exchange configurations for 002 templates (Thailand & Cambodia CEX tasks)
// deposit_history_url / withdrawal_history_url: clickable link
// deposit_history_text / withdrawal_history_text: plain text navigation instruction

export interface ExchangeItemV2 {
  name: string
  official_website: string
  deposit_history_url?: string
  deposit_history_text?: string
  withdrawal_history_url?: string
  withdrawal_history_text?: string
}

// exchange_group = 101: Thailand CEX
const EXCHANGES_TH: ExchangeItemV2[] = [
  {
    name: 'Upbit Thailand',
    official_website: 'https://th.upbit.com/',
    deposit_history_url: 'https://th.upbit.com/balances/THB?tab=deposit',
    withdrawal_history_url: 'https://th.upbit.com/balances/THB?tab=withdraw'
  },
  {
    name: 'KuCoin Thailand',
    official_website: 'https://www.kucoin.th/',
    deposit_history_url: 'https://www.kucoin.th/en/assets/record',
    withdrawal_history_url: 'https://www.kucoin.th/en/assets/record'
  },
  {
    name: 'WaanX',
    official_website: 'https://www.waanx.com/',
    deposit_history_url: 'https://www.waanx.com/en/wallet/history',
    withdrawal_history_url: 'https://www.waanx.com/en/wallet/history'
  },
  {
    name: 'TDX',
    official_website: 'https://www.set.or.th/en/tdx/about',
    deposit_history_text: 'App only: Wallet → History',
    withdrawal_history_text: 'App only: Wallet → History'
  },
  {
    name: 'orbix (Satang Pro)',
    official_website: 'https://www.orbixtrade.com/',
    deposit_history_text: 'App only: Home → Deposit → Deposit History',
    withdrawal_history_text: 'App only: Home → Withdraw → Withdrawal History'
  },
  {
    name: 'Coins.co.th',
    official_website: 'https://www.coins.co.th/',
    deposit_history_text: 'Log in → Portfolio → THB Wallet (history on same page)',
    withdrawal_history_text: 'Log in → Portfolio → THB Wallet (history on same page)'
  },
  {
    name: 'Bitkub',
    official_website: 'https://www.bitkub.com/',
    deposit_history_text: 'Log in → My Wallet → Deposit History',
    withdrawal_history_text: 'Log in → My Wallet → Withdrawal History'
  }
]

// exchange_group = 201: Cambodia CEX
const EXCHANGES_KH: ExchangeItemV2[] = [
  {
    name: 'BloFin',
    official_website: 'https://blofin.com/',
    deposit_history_url: 'https://blofin.com/en/assets/history?type=deposit',
    withdrawal_history_url: 'https://blofin.com/en/assets/history?type=withdraw'
  },
  {
    name: 'RGX (Royal Group Exchange)',
    official_website: 'https://www.rgxtrade.com/',
    deposit_history_text: 'Log in → Profile → Wallet → Deposit History',
    withdrawal_history_text: 'Log in → Profile → Wallet → Withdraw History'
  }
]

const EXCHANGES_IN: ExchangeItemV2[] = [
  {
    name: 'Indodax',
    official_website: 'https://indodax.com/',
    deposit_history_text: 'Log in → Wallet → IDR → Deposit History',
    withdrawal_history_text: 'Log in → Wallet → IDR → Withdrawal History'
  },
  {
    name: 'Pintu',
    official_website: 'https://pintu.co.id/',
    deposit_history_text: 'Log in → Portfolio → Transaction History → Filter Deposit',
    withdrawal_history_text: 'Log in → Portfolio → Transaction History → Filter Withdrawal'
  },
  {
    name: 'Ajaib',
    official_website: 'https://ajaib.co.id/kripto',
    deposit_history_text: 'Log in → Ajaib Kripto → Portfolio → Transaction → Deposit',
    withdrawal_history_text: 'Log in → Ajaib Kripto → Portfolio → Transaction → Withdrawal'
  },
  {
    name: 'Nanovest',
    official_website: 'https://www.nanovest.io/',
    deposit_history_text: 'Log in → Portfolio → Transaction History → Deposit',
    withdrawal_history_text: 'Log in → Portfolio → Transaction History → Withdrawal'
  },
  {
    name: 'Tokocrypto',
    official_website: 'https://www.tokocrypto.com/',
    deposit_history_text: 'Log in → Wallet → Fiat and Spot → Transaction History → Deposit',
    withdrawal_history_text: 'Log in → Wallet → Fiat and Spot → Transaction History → Withdrawal'
  },
  {
    name: 'Reku',
    official_website: 'https://reku.id/',
    deposit_history_text: 'Log in → Portfolio → Transaction History → Filter: Deposit',
    withdrawal_history_text: 'Log in → Portfolio → Transaction History → Filter: Withdrawal'
  },
  {
    name: 'Triv',
    official_website: 'https://triv.co.id/',
    deposit_history_text: 'Log in → Account → Mutation / History → Filter: Deposit',
    withdrawal_history_text: 'Log in → Account → Mutation / History → Filter: Withdrawal'
  },
  {
    name: 'Bittime',
    official_website: 'https://www.bittime.com/',
    deposit_history_text: 'Log in → Wallet → Transaction History → Deposit',
    withdrawal_history_text: 'Log in → Wallet → Transaction History → Withdrawal'
  }
]

const EXCHANGES_V2_MAP: Record<number, ExchangeItemV2[]> = {
  1: EXCHANGES_TH,
  2: EXCHANGES_KH,
  3: EXCHANGES_IN
}

export const getExchangesV2 = (group: number): ExchangeItemV2[] => {
  return EXCHANGES_V2_MAP[group] || []
}
