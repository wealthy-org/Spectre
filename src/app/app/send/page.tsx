"use client";

import { useEffect, useState } from "react";
import { formatUnits, isAddress, parseEther, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Card, PageHeader } from "@/components/app/ui";
import { shieldedPoolAbi } from "@/lib/abi/ShieldedPool";
import { SHIELDED_POOL_ADDRESS, MOCK_USDG_ADDRESS, NATIVE_ASSET } from "@/lib/contracts";
import { robinhoodChainTestnet } from "@/lib/chains";

const CHAIN_ID = robinhoodChainTestnet.id;
const POOL_ADDRESS = SHIELDED_POOL_ADDRESS[CHAIN_ID];
const USDG_ADDRESS = MOCK_USDG_ADDRESS[CHAIN_ID];

const ASSETS = [
  { symbol: "ETH", address: NATIVE_ASSET },
  { symbol: "USDG", address: USDG_ADDRESS },
] as const;

export default function SendPage() {
  const [symbol, setSymbol] = useState<"ETH" | "USDG">("ETH");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const asset = ASSETS.find((a) => a.symbol === symbol)!;

  const { address, isConnected, chainId } = useAccount();
  const onCorrectChain = chainId === CHAIN_ID;
  const ready = isConnected && onCorrectChain;

  const { data: shieldedBalance, refetch: refetchBalance } = useReadContract({
    address: POOL_ADDRESS,
    abi: shieldedPoolAbi,
    functionName: "balanceOf",
    args: [asset.address, address ?? "0x0000000000000000000000000000000000000000"],
    chainId: CHAIN_ID,
    query: { enabled: ready },
  });

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirmed) {
      setAmount("");
      refetchBalance();
      const t = setTimeout(() => reset(), 6000);
      return () => clearTimeout(t);
    }
  }, [isConfirmed, reset, refetchBalance]);

  const recipientValid = isAddress(recipient);
  const canSubmit =
    ready && !!amount && Number(amount) > 0 && recipientValid && recipient.toLowerCase() !== address?.toLowerCase();

  function handleSend() {
    if (!canSubmit) return;
    const amountWei = symbol === "ETH" ? parseEther(amount) : parseUnits(amount, 18);
    writeContract({
      address: POOL_ADDRESS,
      abi: shieldedPoolAbi,
      functionName: "transfer",
      args: [asset.address, recipient as `0x${string}`, amountWei],
      chainId: CHAIN_ID,
    });
  }

  const buttonLabel = !isConnected
    ? "Connect wallet to send"
    : !onCorrectChain
    ? "Switch to Robinhood Chain Testnet"
    : isPending
    ? "Confirm in wallet…"
    : isConfirming
    ? "Sending…"
    : isConfirmed
    ? "Sent ✓"
    : "Send privately";

  return (
    <div>
      <PageHeader
        title="Private transfer"
        lead="Move a shielded balance to another address — an internal ledger move inside the pool, the asset itself never leaves the contract."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <label className="text-xs font-semibold tracking-[0.1em] text-[var(--text-dim)] uppercase">
            Recipient address
          </label>
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x…"
            className="mt-2 w-full rounded-xl border border-[var(--app-border-strong)] bg-transparent px-4 py-3 text-sm text-[var(--glow)] outline-none placeholder:text-[var(--text-dimmer)]"
          />
          {recipient && !recipientValid && (
            <p className="mt-1 text-xs text-rose-400">Not a valid address.</p>
          )}

          <label className="mt-6 block text-xs font-semibold tracking-[0.1em] text-[var(--text-dim)] uppercase">
            Asset
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {ASSETS.map((a) => (
              <button
                key={a.symbol}
                onClick={() => {
                  setSymbol(a.symbol);
                  setAmount("");
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  symbol === a.symbol
                    ? "bg-[var(--ultra)] text-white"
                    : "border border-[var(--app-border-strong)] text-[var(--text-dim)] hover:border-[var(--ultra)]"
                }`}
              >
                {a.symbol}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--text-dimmer)]">
            Your shielded balance:{" "}
            {ready && shieldedBalance !== undefined
              ? `${formatUnits(shieldedBalance, 18)} ${symbol}`
              : "— connect wallet —"}
          </p>

          <label className="mt-6 block text-xs font-semibold tracking-[0.1em] text-[var(--text-dim)] uppercase">
            Amount
          </label>
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-[var(--app-border-strong)] px-4 py-3">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              inputMode="decimal"
              className="w-full bg-transparent text-2xl font-semibold text-[var(--glow)] outline-none placeholder:text-[var(--text-dimmer)]"
            />
            <span className="text-sm font-semibold text-[var(--text-dim)]">{symbol}</span>
          </div>

          <button
            disabled={!canSubmit || isPending || isConfirming}
            onClick={handleSend}
            className="mt-6 w-full rounded-xl bg-[var(--ultra)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--violet)] disabled:opacity-40"
          >
            {buttonLabel}
          </button>

          {error && (
            <p className="mt-3 text-xs text-rose-400">{error.message.split("\n")[0]}</p>
          )}
          {hash && (
            <a
              href={`https://explorer.testnet.chain.robinhood.com/tx/${hash}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 block text-xs text-[var(--lilac)] hover:text-[var(--glow)]"
            >
              View transaction →
            </a>
          )}
        </Card>

        <Card>
          <p className="text-sm font-semibold text-[var(--glow)]">What this actually does</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">
            Phase A: this calls <code>ShieldedPool.transfer()</code>, a plain
            ledger move between two addresses inside the contract. It does
            not hide sender, recipient, or amount — that requires commitments,
            nullifiers, and a ZK proof (brief §15), not yet implemented.
          </p>
        </Card>
      </div>
    </div>
  );
}
