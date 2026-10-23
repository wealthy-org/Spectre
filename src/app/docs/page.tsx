"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  IconShield,
  IconKey,
  IconLock,
  IconProof,
  IconAlert,
  IconExternal,
} from "@/components/app/Icons";
import {
  SHIELDED_POOL_ADDRESS,
  MOCK_USDG_ADDRESS,
  TRADE_WAVE_MANAGER_ADDRESS,
  MOCK_STOCK_TOKENS,
} from "@/lib/contracts";
import { robinhoodChainTestnet } from "@/lib/chains";

type DocSection = {
  id: string;
  title: string;
  category?: string;
  eyebrow: string;
  nextId?: string;
  nextTitle?: string;
};

const DOC_SECTIONS: DocSection[] = [
  {
    id: "welcome",
    title: "Welcome to Spectre",
    eyebrow: "DOCS",
    nextId: "get-started",
    nextTitle: "Get started",
  },
  {
    id: "get-started",
    title: "Get started",
    category: "GETTING STARTED",
    eyebrow: "GETTING STARTED",
    nextId: "networks",
    nextTitle: "Networks and addresses",
  },
  {
    id: "networks",
    title: "Networks and addresses",
    category: "GETTING STARTED",
    eyebrow: "GETTING STARTED",
    nextId: "deposit",
    nextTitle: "Deposit & Shield",
  },
  {
    id: "deposit",
    title: "Deposit & Shield",
    category: "USING SPECTRE",
    eyebrow: "USING SPECTRE",
    nextId: "trade-waves",
    nextTitle: "Trade Waves",
  },
  {
    id: "trade-waves",
    title: "Trade Waves",
    category: "USING SPECTRE",
    eyebrow: "USING SPECTRE",
    nextId: "send",
    nextTitle: "Send privately",
  },
  {
    id: "send",
    title: "Send privately",
    category: "USING SPECTRE",
    eyebrow: "USING SPECTRE",
    nextId: "withdraw",
    nextTitle: "Withdraw",
  },
  {
    id: "withdraw",
    title: "Withdraw",
    category: "USING SPECTRE",
    eyebrow: "USING SPECTRE",
    nextId: "gas-balance",
    nextTitle: "Gas balance & Relayer",
  },
  {
    id: "gas-balance",
    title: "Gas balance & Relayer",
    category: "USING SPECTRE",
    eyebrow: "USING SPECTRE",
    nextId: "fees",
    nextTitle: "Fees & Netting",
  },
  {
    id: "fees",
    title: "Fees & Netting",
    category: "FEES AND ECONOMICS",
    eyebrow: "FEES AND ECONOMICS",
    nextId: "what-stays-private",
    nextTitle: "What stays private",
  },
  {
    id: "what-stays-private",
    title: "What stays private",
    category: "PRIVACY AND SAFETY",
    eyebrow: "PRIVACY AND SAFETY",
    nextId: "deposit-checks",
    nextTitle: "Deposit checks & Compliance",
  },
  {
    id: "deposit-checks",
    title: "Deposit checks & Compliance",
    category: "PRIVACY AND SAFETY",
    eyebrow: "PRIVACY AND SAFETY",
    nextId: "security",
    nextTitle: "Security & Threat Model",
  },
  {
    id: "security",
    title: "Security & Threat Model",
    category: "PRIVACY AND SAFETY",
    eyebrow: "PRIVACY AND SAFETY",
    nextId: "faq",
    nextTitle: "FAQ",
  },
  {
    id: "faq",
    title: "FAQ",
    category: "MORE",
    eyebrow: "MORE",
    nextId: "roadmap",
    nextTitle: "Project Roadmap",
  },
  {
    id: "roadmap",
    title: "Project Roadmap",
    category: "MORE",
    eyebrow: "MORE",
  },
];

export default function DocsPage() {
  const [activeId, setActiveId] = useState("welcome");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentDoc = DOC_SECTIONS.find((d) => d.id === activeId) ?? DOC_SECTIONS[0];

  const categories = [
    { name: null, items: DOC_SECTIONS.filter((d) => !d.category) },
    {
      name: "GETTING STARTED",
      items: DOC_SECTIONS.filter((d) => d.category === "GETTING STARTED"),
    },
    {
      name: "USING SPECTRE",
      items: DOC_SECTIONS.filter((d) => d.category === "USING SPECTRE"),
    },
    {
      name: "FEES AND ECONOMICS",
      items: DOC_SECTIONS.filter((d) => d.category === "FEES AND ECONOMICS"),
    },
    {
      name: "PRIVACY AND SAFETY",
      items: DOC_SECTIONS.filter((d) => d.category === "PRIVACY AND SAFETY"),
    },
    {
      name: "MORE",
      items: DOC_SECTIONS.filter((d) => d.category === "MORE"),
    },
  ];

  function handleSelectDoc(id: string) {
    setActiveId(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#18181B] font-sans antialiased selection:bg-[#EBDDFF] selection:text-[#3C1878]">
      {/* Top Header matching reference styling */}
      <header className="sticky top-0 z-40 border-b border-[#E4E4E7] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/brand/logo.png"
                alt="Spectre"
                width={30}
                height={30}
                className="h-7 w-7"
              />
              <span className="font-extrabold tracking-[0.12em] text-[#18181B] uppercase text-sm sm:text-base">
                SPECTRE
              </span>
            </Link>
            <span className="hidden text-xs text-[#71717A] sm:inline border-l border-[#E4E4E7] pl-3">
              Documentation
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="rounded-lg bg-[#6024A8] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#7B33D0]"
            >
              Launch App
            </Link>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="p-1.5 text-[#18181B] md:hidden rounded-lg hover:bg-gray-100"
              aria-label="Toggle navigation"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto flex max-w-7xl">
        {/* Left Sidebar */}
        <aside
          className={`fixed inset-y-16 left-0 z-30 w-72 shrink-0 overflow-y-auto border-r border-[#E4E4E7] bg-white p-5 transition-transform duration-200 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <nav className="space-y-6">
            {categories.map((cat, idx) => (
              <div key={idx}>
                {cat.name && (
                  <div className="mb-2 px-3 text-[10px] font-bold tracking-wider text-[#A1A1AA] uppercase">
                    {cat.name}
                  </div>
                )}
                <div className="space-y-1">
                  {cat.items.map((item) => {
                    const isActive = activeId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectDoc(item.id)}
                        className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-all ${
                          isActive
                            ? "bg-[#18181B] text-white font-semibold shadow-sm"
                            : "text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B]"
                        }`}
                      >
                        {isActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#EAB308]" />
                        )}
                        <span>{item.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Content Pane */}
        <main className="min-w-0 flex-1 px-5 py-10 sm:px-12 lg:px-16">
          <div className="mx-auto max-w-3xl">
            {/* Eyebrow */}
            <div className="text-[11px] font-bold tracking-widest text-[#71717A] uppercase mb-2">
              {currentDoc.eyebrow}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-extrabold tracking-tight text-[#18181B] sm:text-4xl">
              {currentDoc.title}
            </h1>

            {/* Content Switcher */}
            <div className="mt-8 text-[15px] leading-relaxed text-[#3F3F46]">
              {activeId === "welcome" && <DocWelcome onSelect={handleSelectDoc} />}
              {activeId === "get-started" && <DocGetStarted onSelect={handleSelectDoc} />}
              {activeId === "networks" && <DocNetworks />}
              {activeId === "deposit" && <DocDeposit />}
              {activeId === "trade-waves" && <DocTradeWaves />}
              {activeId === "send" && <DocSend />}
              {activeId === "withdraw" && <DocWithdraw />}
              {activeId === "gas-balance" && <DocGasBalance />}
              {activeId === "fees" && <DocFees />}
              {activeId === "what-stays-private" && <DocWhatStaysPrivate />}
              {activeId === "deposit-checks" && <DocDepositChecks />}
              {activeId === "security" && <DocSecurity />}
              {activeId === "faq" && <DocFAQ />}
              {activeId === "roadmap" && <DocRoadmap />}
            </div>

            {/* Pagination Next button at bottom right (like Nullmask screenshot) */}
            {currentDoc.nextId && currentDoc.nextTitle && (
              <div className="mt-14 flex justify-end pt-6 border-t border-[#E4E4E7]">
                <button
                  type="button"
                  onClick={() => handleSelectDoc(currentDoc.nextId!)}
                  className="group flex flex-col items-end rounded-xl border border-[#E4E4E7] bg-white p-4 pl-8 shadow-sm transition-all hover:border-[#18181B] hover:shadow-md"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] group-hover:text-[#18181B] transition-colors">
                    NEXT →
                  </span>
                  <span className="text-sm font-bold text-[#18181B]">
                    {currentDoc.nextTitle}
                  </span>
                </button>
              </div>
            )}

            {/* Footer */}
            <footer className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E4E4E7] pt-8 text-xs text-[#71717A]">
              <div>Spectre Docs · Built for Robinhood Chain</div>
              <div className="flex gap-5">
                <Link href="/" className="hover:text-[#18181B]">
                  Home
                </Link>
                <Link href="/privacy" className="hover:text-[#18181B]">
                  Privacy Model
                </Link>
                <Link href="/proof" className="hover:text-[#18181B]">
                  Settlement Proofs
                </Link>
                <Link
                  href="https://explorer.testnet.chain.robinhood.com"
                  target="_blank"
                  className="hover:text-[#18181B]"
                >
                  Explorer ↗
                </Link>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

/* =========================================================================
   DOC COMPONENTS
   ========================================================================= */

function DocWelcome({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <p>
        Spectre is a private market layer for your wallet, built natively for{" "}
        <strong>Robinhood Chain (Arbitrum Orbit L2)</strong>. You deposit assets
        into a shared pool, and from there you can send, swap private stock
        tokens, and withdraw them without the blockchain revealing your entire portfolio strategy or linking public identities.
      </p>

      <p>
        You keep using the wallet you already have. Spectre authenticates you through
        client-side key derivation (EIP-191), and every action is a normal transaction
        or cryptographically signed intent that your wallet signs.
      </p>

      <h2 className="text-xl font-bold text-[#18181B] pt-4">What you can do</h2>
      <ul className="list-disc pl-5 space-y-2 text-[#3F3F46]">
        <li>
          <strong>Deposit / Shield</strong> ETH or supported tokens (USDG) from your wallet into your private balance.
        </li>
        <li>
          <strong>Send privately</strong> to another Spectre shielded address without onchain sender-receiver linkage.
        </li>
        <li>
          <strong>Withdraw</strong> to any address, right away or batched inside a Withdrawal Wave.
        </li>
        <li>
          <strong>Trade</strong> between supported assets and synthetic stock tokens (NVDA, TSLA, AAPL) through periodic batch Trade Waves.
        </li>
        <li>
          <strong>Internal Netting</strong>: Offsetting buy and sell orders are crossed internally with zero market impact before remaining imbalance is routed.
        </li>
      </ul>

      <h2 className="text-xl font-bold text-[#18181B] pt-4">How it works in one minute</h2>
      <ol className="list-decimal pl-5 space-y-3 text-[#3F3F46]">
        <li>
          Open <code>app.spectre.trade</code>, connect your wallet and ensure you are on the <strong>Robinhood Chain Testnet (Chain ID 46630)</strong>.
        </li>
        <li>
          Sign one message. It derives your Spectre account keys (<code>spendingKey</code>, <code>viewingKey</code>, <code>privateAddress</code>). Signing costs zero gas.
        </li>
        <li>
          Deposit. Your deposit is confirmed and credited to your shielded private balance.
        </li>
        <li>
          Send, trade, or withdraw. Your wallet signs each action, and Spectre settles batch orders onchain with verifiable settlement proofs.
        </li>
      </ol>

      <h2 className="text-xl font-bold text-[#18181B] pt-4">Start here</h2>
      <ul className="list-disc pl-5 space-y-2 text-[#3F3F46]">
        <li>
          <button onClick={() => onSelect("get-started")} className="font-semibold text-[#6024A8] underline">
            Get started
          </button>
          : connect your wallet and make your first deposit.
        </li>
        <li>
          <button onClick={() => onSelect("fees")} className="font-semibold text-[#6024A8] underline">
            Fees & Netting
          </button>
          : what each action costs.
        </li>
        <li>
          <button onClick={() => onSelect("what-stays-private")} className="font-semibold text-[#6024A8] underline">
            What stays private
          </button>
          : what others can and cannot see in Phase A vs Phase 2.
        </li>
        <li>
          <button onClick={() => onSelect("faq")} className="font-semibold text-[#6024A8] underline">
            FAQ
          </button>
          : short answers to common questions.
        </li>
      </ul>

      {/* Warning Callout Card */}
      <div className="rounded-xl border-l-4 border-l-[#18181B] border border-[#E4E4E7] bg-white p-4 shadow-sm">
        <p className="text-xs text-[#52525B] leading-relaxed">
          Spectre is live on Robinhood Chain Testnet. Read the{" "}
          <Link href="/privacy" className="font-semibold text-[#18181B] underline">
            Privacy & Threat Disclosures
          </Link>{" "}
          before depositing, and do not deposit more than you can afford to test.
        </p>
      </div>
    </div>
  );
}

function DocGetStarted({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <p>
        Getting started with Spectre takes less than two minutes on Robinhood Chain Testnet.
      </p>

      <h3 className="text-lg font-bold text-[#18181B]">1. Configure your Web3 Wallet</h3>
      <p>
        Ensure your wallet (MetaMask, Rabby, or Coinbase Wallet) has the Robinhood Chain Testnet network added:
      </p>
      <div className="rounded-xl border border-[#E4E4E7] bg-[#F4F4F5] p-4 font-mono text-xs text-[#27272A] space-y-1">
        <div>Network Name: Robinhood Chain Testnet</div>
        <div>Chain ID: 46630</div>
        <div>Currency Symbol: ETH</div>
        <div>RPC URL: https://robinhood-sepolia-rpc.publicnode.com</div>
        <div>Block Explorer: https://explorer.testnet.chain.robinhood.com</div>
      </div>

      <h3 className="text-lg font-bold text-[#18181B]">2. Derive your Private Account Key</h3>
      <p>
        Upon connecting, click <strong>Derive Shield Key</strong>. Spectre requests an EIP-191 personal signature containing a deterministic domain separation string:
      </p>
      <blockquote className="rounded-lg border-l-2 border-[#6024A8] bg-[#F4F4F5] p-3 text-xs font-mono text-[#52525B]">
        PROJECT: Spectre<br />
        CHAIN: Robinhood Chain<br />
        PURPOSE: Client-Side Private Account Key Derivation<br />
        VERSION: 1
      </blockquote>
      <p className="text-xs text-[#52525B]">
        This signature generates your <code>spendingKey</code> and <code>viewingKey</code> locally in your browser memory. No private seeds are ever broadcasted to any server or mempool.
      </p>

      <h3 className="text-lg font-bold text-[#18181B]">3. Shield Your First Assets</h3>
      <p>
        Navigate to the <strong>Shield</strong> tab in the app. Enter an amount of ETH or USDG to deposit into the <code>ShieldedPool</code>. Once the transaction confirms, your onchain balance transitions into the shielded state.
      </p>
    </div>
  );
}

function DocNetworks() {
  const POOL_ADDR = SHIELDED_POOL_ADDRESS[robinhoodChainTestnet.id];
  const WAVE_ADDR = TRADE_WAVE_MANAGER_ADDRESS[robinhoodChainTestnet.id];
  const USDG_ADDR = MOCK_USDG_ADDRESS[robinhoodChainTestnet.id];

  return (
    <div className="space-y-6">
      <p>
        Spectre smart contracts are deployed and verified on Robinhood Chain Testnet (Arbitrum Orbit L2).
      </p>

      <div className="overflow-x-auto rounded-xl border border-[#E4E4E7] bg-white">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[#E4E4E7] bg-[#F4F4F5] font-semibold text-[#18181B]">
            <tr>
              <th className="p-3">Contract / Asset</th>
              <th className="p-3">Onchain Address</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E7] font-mono text-[#52525B]">
            <tr>
              <td className="p-3 font-semibold text-[#18181B] font-sans">ShieldedPool (Core)</td>
              <td className="p-3">{POOL_ADDR}</td>
              <td className="p-3">
                <Link
                  href={`https://explorer.testnet.chain.robinhood.com/address/${POOL_ADDR}`}
                  target="_blank"
                  className="text-[#6024A8] hover:underline"
                >
                  Explorer ↗
                </Link>
              </td>
            </tr>
            <tr>
              <td className="p-3 font-semibold text-[#18181B] font-sans">TradeWaveManager</td>
              <td className="p-3">{WAVE_ADDR}</td>
              <td className="p-3">
                <Link
                  href={`https://explorer.testnet.chain.robinhood.com/address/${WAVE_ADDR}`}
                  target="_blank"
                  className="text-[#6024A8] hover:underline"
                >
                  Explorer ↗
                </Link>
              </td>
            </tr>
            <tr>
              <td className="p-3 font-semibold text-[#18181B] font-sans">Mock USDG Token</td>
              <td className="p-3">{USDG_ADDR}</td>
              <td className="p-3">
                <Link
                  href={`https://explorer.testnet.chain.robinhood.com/address/${USDG_ADDR}`}
                  target="_blank"
                  className="text-[#6024A8] hover:underline"
                >
                  Explorer ↗
                </Link>
              </td>
            </tr>
            {Object.entries(MOCK_STOCK_TOKENS).map(([ticker, addr]) => (
              <tr key={ticker}>
                <td className="p-3 font-semibold text-[#18181B] font-sans">Mock Stock Token ({ticker})</td>
                <td className="p-3">{addr}</td>
                <td className="p-3">
                  <Link
                    href={`https://explorer.testnet.chain.robinhood.com/address/${addr}`}
                    target="_blank"
                    className="text-[#6024A8] hover:underline"
                  >
                    Explorer ↗
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocDeposit() {
  return (
    <div className="space-y-6">
      <p>
        Depositing into the Spectre pool shields your tokens from public balance observers.
      </p>
      <h3 className="text-lg font-bold text-[#18181B]">Standard Amounts vs Unique Amounts</h3>
      <p>
        To maximize privacy, it is strongly recommended to deposit in round, standard increments (e.g., 0.1 ETH, 0.5 ETH, 1.0 ETH, or 100 USDG, 500 USDG). Depositing unusual fractions (such as 0.384729 ETH) makes it easier for heuristic observers to link pool deposits to later withdrawals.
      </p>
      <h3 className="text-lg font-bold text-[#18181B]">How Shielding Works</h3>
      <p>
        When you submit a deposit transaction:
      </p>
      <ul className="list-disc pl-5 space-y-2 text-[#3F3F46]">
        <li>Your wallet transfers the asset to the <code>ShieldedPool</code> contract.</li>
        <li>The pool records the deposited value against your shielded account balance.</li>
        <li>Future internal actions (trades, transfers) happen without modifying the public balance of your original EOA address.</li>
      </ul>
    </div>
  );
}

function DocTradeWaves() {
  return (
    <div className="space-y-6">
      <p>
        Spectre replaces continuous public orderbooks and AMMs with <strong>Trade Waves</strong>: discrete batch auction intervals designed to eliminate MEV and sandwich attacks.
      </p>
      <h3 className="text-lg font-bold text-[#18181B]">The 3-Minute Wave Lifecycle</h3>
      <ol className="list-decimal pl-5 space-y-2 text-[#3F3F46]">
        <li><strong>Open Phase (2–5 minutes)</strong>: Users queue buy or sell intents with strict maximum slippage limits.</li>
        <li><strong>Lock Phase (30 seconds)</strong>: Order queue freezes; the offchain coordinator computes optimal clearing.</li>
        <li><strong>Settlement & Netting</strong>: Offsetting buys and sells are matched 1:1 internally at zero slippage. Remaining net imbalance is routed via Uniswap v3 on Robinhood Chain.</li>
        <li><strong>Batch Proof Publishing</strong>: The settlement root is posted to the <code>TradeWaveManager</code> contract onchain.</li>
      </ol>
    </div>
  );
}

function DocSend() {
  return (
    <div className="space-y-6">
      <p>
        Private Send allows transferring shielded value directly to another Spectre account ID without exposing the transaction on the public block explorer.
      </p>
      <h3 className="text-lg font-bold text-[#18181B]">Shielded Address Format</h3>
      <p>
        Spectre private addresses use deterministic 32-byte hexadecimal identifiers (e.g., <code>0xcee36198...</code>) derived from the recipient's viewing key.
      </p>
      <p>
        Because transfers happen within the shielded pool state, third-party block explorers see zero direct transfer events between the public EOA addresses.
      </p>
    </div>
  );
}

function DocWithdraw() {
  return (
    <div className="space-y-6">
      <p>
        When withdrawing assets from Spectre, funds return to the public onchain layer of Robinhood Chain.
      </p>
      <h3 className="text-lg font-bold text-[#18181B]">Withdrawal Waves</h3>
      <p>
        Rather than withdrawing immediately — which may create a timing correlation with a recent deposit — Spectre supports <strong>Withdrawal Waves</strong> (15-minute batch windows). All exit requests in the wave are processed simultaneously in a single transaction batch.
      </p>
    </div>
  );
}

function DocGasBalance() {
  return (
    <div className="space-y-6">
      <p>
        In a private protocol, paying gas directly from your public EOA wallet can reveal your identity through fee transaction graphs.
      </p>
      <h3 className="text-lg font-bold text-[#18181B]">Relayer Sponsoring</h3>
      <p>
        Spectre's architecture incorporates decentralized relayers that submit settlement proofs and user intents onchain. Users pay small protocol fees in USDG or ETH from their shielded pool balance, eliminating the need to broadcast gas from an identifiable EOA.
      </p>
    </div>
  );
}

function DocFees() {
  return (
    <div className="space-y-6">
      <p>
        Spectre charges low, transparent fees designed to incentivize internal order netting.
      </p>
      <div className="overflow-x-auto rounded-xl border border-[#E4E4E7] bg-white">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[#E4E4E7] bg-[#F4F4F5] font-semibold text-[#18181B]">
            <tr>
              <th className="p-3">Action</th>
              <th className="p-3">Fee</th>
              <th className="p-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E7] text-[#52525B]">
            <tr>
              <td className="p-3 font-semibold text-[#18181B]">Deposit / Shield</td>
              <td className="p-3 font-mono">0.00%</td>
              <td className="p-3">Free, standard L2 gas only</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold text-[#18181B]">Internal Netting Trade</td>
              <td className="p-3 font-mono">0.05%</td>
              <td className="p-3">Discounted for volume matched internally</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold text-[#18181B]">Imbalance External Route</td>
              <td className="p-3 font-mono">0.15%</td>
              <td className="p-3">+ Underlying DEX pool swap fee</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold text-[#18181B]">Private Send</td>
              <td className="p-3 font-mono">0.00%</td>
              <td className="p-3">Zero pool protocol fee</td>
            </tr>
            <tr>
              <td className="p-3 font-semibold text-[#18181B]">Withdrawal Wave</td>
              <td className="p-3 font-mono">0.10%</td>
              <td className="p-3">Relayer subsidy and batch aggregation</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocWhatStaysPrivate() {
  return (
    <div className="space-y-6">
      <p>
        Transparency is essential for security. Spectre provides clear disclosures regarding what is private today versus what requires Phase 2 zero-knowledge proofs.
      </p>

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-950">
          <IconAlert className="h-4 w-4" />
          <span>Phase A Status (Live Testbed Prototype)</span>
        </div>
        <p>
          Current balances on Robinhood Chain Testnet are stored in an open accounting contract (<code>balanceOf</code> mapping) to verify deposit, trade, and settlement netting math prior to ZK-SNARK verifier activation in Phase 2.
        </p>
      </div>

      <h3 className="text-lg font-bold text-[#18181B]">What Becomes Completely Private in Phase 2</h3>
      <ul className="list-disc pl-5 space-y-2 text-[#3F3F46]">
        <li><strong>Account Balances</strong>: Hidden within encrypted UTXO notes and Merkle commitment trees.</li>
        <li><strong>Trade Amounts</strong>: Observers cannot see individual positions, stop levels, or portfolio allocations.</li>
        <li><strong>Transaction Counterparties</strong>: Senders and receivers cannot be linked through onchain graphs.</li>
      </ul>

      <h3 className="text-lg font-bold text-[#18181B]">What Remains Permanently Public</h3>
      <p>
        Deposit and withdrawal transactions at the contract boundary are inherently public on the L2 ledger. Spectre severs the linkage between deposits and withdrawals through pool mingling and batch waves.
      </p>
    </div>
  );
}

function DocDepositChecks() {
  return (
    <div className="space-y-6">
      <p>
        Spectre is built for compliant, privacy-preserving institutional and retail capital.
      </p>
      <h3 className="text-lg font-bold text-[#18181B]">Compliance & Viewing Keys</h3>
      <p>
        Every user retains their cryptographic <code>viewingKey</code>. While third parties cannot observe your portfolio, you can voluntarily export a read-only audit proof to tax advisors or compliance auditors to prove transaction history and lawful provenance.
      </p>
    </div>
  );
}

function DocSecurity() {
  return (
    <div className="space-y-6">
      <p>
        Spectre smart contracts are non-custodial and built with strict security invariants.
      </p>
      <ul className="list-disc pl-5 space-y-2 text-[#3F3F46]">
        <li><strong>Non-Custodial Design</strong>: The protocol has no administrative key capable of seizing deposited user collateral.</li>
        <li><strong>Emergency Refund Mechanism</strong>: In the event a Trade Wave is not settled within the deadline, users can reclaim 100% of escrowed intents immediately.</li>
        <li><strong>Slippage Invariants</strong>: Every trade wave execution enforces strict maximum slippage bounds before onchain state commitment.</li>
      </ul>
    </div>
  );
}

function DocFAQ() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="font-bold text-[#18181B]">Is Spectre live on mainnet?</h3>
        <p className="text-sm text-[#52525B]">
          Spectre is currently active on the official <strong>Robinhood Chain Testnet (Chain ID 46630)</strong>. Mainnet deployment is scheduled following external audits and Phase 2 ZK circuits.
        </p>
      </div>
      <div className="space-y-3">
        <h3 className="font-bold text-[#18181B]">Can Robinhood freeze my shielded balance?</h3>
        <p className="text-sm text-[#52525B]">
          No. Spectre smart contracts are autonomous and non-custodial. Funds deposited in the <code>ShieldedPool</code> can only be withdrawn by the holder of the corresponding cryptographic private key.
        </p>
      </div>
      <div className="space-y-3">
        <h3 className="font-bold text-[#18181B]">What stock tokens are supported?</h3>
        <p className="text-sm text-[#52525B]">
          Testnet currently supports synthetic stock tokens for <strong>NVDA</strong>, <strong>TSLA</strong>, and <strong>AAPL</strong>.
        </p>
      </div>
    </div>
  );
}

function DocRoadmap() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#18181B]">Phase 1: Transparent Prototype</span>
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              COMPLETED
            </span>
          </div>
          <p className="mt-2 text-xs text-[#52525B]">
            ShieldedPool, TradeWaveManager, MockStockTokens, deterministic EIP-191 key derivation, and Netting visualizer.
          </p>
        </div>

        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#18181B]">Phase 2: Zero-Knowledge SNARKs</span>
            <span className="rounded bg-[#6024A8]/10 px-2 py-0.5 text-[10px] font-bold text-[#6024A8]">
              IN PROGRESS
            </span>
          </div>
          <p className="mt-2 text-xs text-[#52525B]">
            Circom circuits, Groth16 onchain verifiers on Robinhood Chain, note nullifiers, client-side proving.
          </p>
        </div>

        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#18181B]">Phase 3: Relayer Network & Mainnet</span>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
              PLANNED
            </span>
          </div>
          <p className="mt-2 text-xs text-[#52525B]">
            Decentralized relayer nodes, institutional audit exports, and Robinhood Chain mainnet launch.
          </p>
        </div>
      </div>
    </div>
  );
}
