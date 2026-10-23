"use client";

import { useEffect, useState } from "react";
import { formatUnits, type Log } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { Card, PageHeader, Pill } from "@/components/app/ui";
import { shieldedPoolAbi } from "@/lib/abi/ShieldedPool";
import {
  SHIELDED_POOL_ADDRESS,
  SHIELDED_POOL_DEPLOY_BLOCK,
  NATIVE_ASSET,
} from "@/lib/contracts";
import { robinhoodChainTestnet } from "@/lib/chains";

const CHAIN_ID = robinhoodChainTestnet.id;
const POOL_ADDRESS = SHIELDED_POOL_ADDRESS[CHAIN_ID];
const DEPLOY_BLOCK = SHIELDED_POOL_DEPLOY_BLOCK[CHAIN_ID];

type Item = {
  key: string;
  kind: "Shield" | "Withdraw" | "Send" | "Received";
  detail: string;
  blockNumber: bigint;
  time: string;
  status: string;
  txHash: string;
};

function symbolOf(asset: string) {
  return asset.toLowerCase() === NATIVE_ASSET ? "ETH" : "USDG";
}

function timeAgo(timestampSec: number) {
  const diff = Date.now() / 1000 - timestampSec;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ActivityPage() {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId: CHAIN_ID });
  const onCorrectChain = chainId === CHAIN_ID;

  const [items, setItems] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address || !isConnected || !onCorrectChain || !publicClient) {
      setItems(null);
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      const [deposited, withdrawn, transferred] = await Promise.all([
        publicClient.getContractEvents({
          address: POOL_ADDRESS,
          abi: shieldedPoolAbi,
          eventName: "Deposited",
          args: { owner: address },
          fromBlock: DEPLOY_BLOCK,
          toBlock: "latest",
        }),
        publicClient.getContractEvents({
          address: POOL_ADDRESS,
          abi: shieldedPoolAbi,
          eventName: "Withdrawn",
          args: { owner: address },
          fromBlock: DEPLOY_BLOCK,
          toBlock: "latest",
        }),
        publicClient.getContractEvents({
          address: POOL_ADDRESS,
          abi: shieldedPoolAbi,
          eventName: "Transferred",
          fromBlock: DEPLOY_BLOCK,
          toBlock: "latest",
        }),
      ]);

      const sentOrReceived = (transferred as (Log & { args: Record<string, unknown> })[]).filter(
        (l) =>
          (l.args.from as string | undefined)?.toLowerCase() === address.toLowerCase() ||
          (l.args.to as string | undefined)?.toLowerCase() === address.toLowerCase()
      );

      const allLogs = [
        ...(deposited as (Log & { args: Record<string, unknown> })[]).map((l) => ({ l, kind: "Shield" as const })),
        ...(withdrawn as (Log & { args: Record<string, unknown> })[]).map((l) => ({ l, kind: "Withdraw" as const })),
        ...sentOrReceived.map((l) => ({
          l,
          kind: (l.args.from as string).toLowerCase() === address.toLowerCase() ? ("Send" as const) : ("Received" as const),
        })),
      ];

      const blockNumbers = [...new Set(allLogs.map((x) => x.l.blockNumber!))];
      const blocks = await Promise.all(
        blockNumbers.map((bn) => publicClient.getBlock({ blockNumber: bn }))
      );
      const tsByBlock = new Map(blocks.map((b) => [b.number, Number(b.timestamp)]));

      const built: Item[] = allLogs.map(({ l, kind }) => {
        const asset = symbolOf(l.args.asset as string);
        const amount = formatUnits(l.args.amount as bigint, 18);
        const detail =
          kind === "Shield"
            ? `Deposited ${amount} ${asset}`
            : kind === "Withdraw"
            ? `Withdrew ${amount} ${asset} to ${(l.args.to as string).slice(0, 6)}…`
            : kind === "Send"
            ? `Sent ${amount} ${asset} to ${(l.args.to as string).slice(0, 6)}…`
            : `Received ${amount} ${asset} from ${(l.args.from as string).slice(0, 6)}…`;
        const ts = tsByBlock.get(l.blockNumber!) ?? 0;
        return {
          key: `${l.transactionHash}-${l.logIndex}`,
          kind,
          detail,
          blockNumber: l.blockNumber!,
          time: timeAgo(ts),
          status: "Confirmed",
          txHash: l.transactionHash!,
        };
      });

      built.sort((a, b) => (b.blockNumber > a.blockNumber ? 1 : -1));

      if (!cancelled) {
        setItems(built);
        setLoading(false);
      }
    })().catch((e) => {
      console.error("Failed to load activity", e);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [address, isConnected, onCorrectChain, publicClient]);

  const counts = {
    Shield: items?.filter((i) => i.kind === "Shield").length ?? 0,
    Send: items?.filter((i) => i.kind === "Send").length ?? 0,
    Received: items?.filter((i) => i.kind === "Received").length ?? 0,
    Withdraw: items?.filter((i) => i.kind === "Withdraw").length ?? 0,
  };

  return (
    <div>
      <PageHeader
        title="Activity"
        lead="Read directly from ShieldedPool events on Robinhood Chain Testnet — not stored on any Spectre server."
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-0">
          {!isConnected ? (
            <p className="px-6 py-8 text-sm text-[var(--text-dim)]">
              Connect your wallet to load your onchain activity.
            </p>
          ) : !onCorrectChain ? (
            <p className="px-6 py-8 text-sm text-[var(--text-dim)]">
              Switch to Robinhood Chain Testnet to load your activity.
            </p>
          ) : loading ? (
            <p className="px-6 py-8 text-sm text-[var(--text-dim)]">Loading onchain history…</p>
          ) : items && items.length > 0 ? (
            <ul className="divide-y divide-[var(--app-border)]">
              {items.map((a) => (
                <li
                  key={a.key}
                  className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
                >
                  <div className="flex items-center gap-3">
                    <Pill tone="muted">{a.kind}</Pill>
                    <span className="text-sm text-[var(--glow)]">{a.detail}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={`https://explorer.testnet.chain.robinhood.com/tx/${a.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hidden text-xs text-[var(--text-dimmer)] hover:text-[var(--lilac)] sm:inline"
                    >
                      {a.time}
                    </a>
                    <Pill tone="default">{a.status}</Pill>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-6 py-8 text-sm text-[var(--text-dim)]">
              No onchain activity yet for this address on Robinhood Chain Testnet.
            </p>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <p className="text-sm font-semibold text-[var(--glow)]">This address</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {Object.entries(counts).map(([label, count]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[var(--app-border)] bg-[var(--surface-2)] px-4 py-3"
                >
                  <p className="text-xl font-bold text-[var(--glow)]">{count}</p>
                  <p className="text-xs text-[var(--text-dim)]">{label}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-[var(--glow)]">Onchain, not server-side</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">
              Every row above is read live from <code>ShieldedPool</code> event
              logs on Robinhood Chain Testnet via <code>getContractEvents</code>.
              Spectre's frontend has no backend database for this.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
