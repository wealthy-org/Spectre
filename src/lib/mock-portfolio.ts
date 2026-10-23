// Colors chosen to stay legible against the dark app surface — every
// segment must read clearly on var(--surface), unlike the light-theme
// landing palette this was first copied from.
export const HOLDINGS = [
  { ticker: "USDG", name: "USD Global", value: 8000, pct: 33, color: "#9C48F0" },
  { ticker: "NVDA", name: "NVIDIA Stock Token", value: 5143, pct: 21, color: "#4FD1C5" },
  { ticker: "TSLA", name: "Tesla Stock Token", value: 3921, pct: 16, color: "#F0A848" },
  { ticker: "AAPL", name: "Apple Stock Token", value: 3082, pct: 13, color: "#F0609C" },
  { ticker: "ETH", name: "Ethereum", value: 4219, pct: 17, color: "#C9A2FF" },
] as const;

export const TOTAL = HOLDINGS.reduce((s, h) => s + h.value, 0);

export const ACTIVITY = [
  { id: 1, kind: "Shield", detail: "Deposited 2.0 ETH", time: "2m ago", status: "Confirmed" },
  { id: 2, kind: "Trade", detail: "Wave #184 · USDG → NVDA", time: "18m ago", status: "Settled" },
  { id: 3, kind: "Send", detail: "Private transfer · 500 USDG", time: "1h ago", status: "Confirmed" },
  { id: 4, kind: "Withdraw", detail: "Wave exit · 250 USDG", time: "3h ago", status: "Settled" },
  { id: 5, kind: "Shield", detail: "Deposited 1,000 USDG", time: "1d ago", status: "Confirmed" },
] as const;

export const WAVES = [
  { id: 184, kind: "Trade", status: "Settled", input: "$86,420 USDG", output: "NVDA", time: "18m ago" },
  { id: 183, kind: "Trade", status: "Settled", input: "$41,200 USDG", output: "TSLA", time: "22m ago" },
  { id: 56, kind: "Withdrawal", status: "Settled", input: "4 exits", output: "Robinhood Chain", time: "1h ago" },
  { id: 182, kind: "Trade", status: "Settled", input: "$12,050 USDG", output: "AAPL", time: "26m ago" },
] as const;
