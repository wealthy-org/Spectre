"use client";

import { useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { robinhoodChainTestnet } from "@/lib/chains";
import { usePrivateAccount } from "@/lib/private-account";

function truncate(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ConnectWalletButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { isUnlocked, keys, unlock, lock, isDeriving, error: derivationError } = usePrivateAccount();

  const [openConnect, setOpenConnect] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [showViewingKey, setShowViewingKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const wrongNetwork = isConnected && chainId !== robinhoodChainTestnet.id;

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  if (isConnected && address) {
    if (wrongNetwork) {
      return (
        <button
          onClick={() => switchChain({ chainId: robinhoodChainTestnet.id })}
          disabled={isSwitching}
          className="rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-400 disabled:opacity-60"
        >
          {isSwitching ? "Switching…" : "Wrong network — switch"}
        </button>
      );
    }

    return (
      <div className="relative flex items-center gap-2">
        {/* Shield Account Key Status / Unlock Trigger */}
        {!isUnlocked ? (
          <button
            onClick={() => unlock()}
            disabled={isDeriving}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--ultra)] bg-[var(--ultra)]/15 px-3 py-1.5 text-xs font-semibold text-[var(--glow)] transition-colors hover:bg-[var(--ultra)] hover:text-white disabled:opacity-60"
            title="Derive your Spectre client-side private account key via signature"
          >
            <span>🗝️</span>
            <span>{isDeriving ? "Deriving…" : "Derive Shield Key"}</span>
          </button>
        ) : (
          <button
            onClick={() => setOpenModal((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
            title="Spectre Private Account active"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Shield: {truncate(keys!.privateAddress)}</span>
          </button>
        )}

        {/* EOA Wallet Button */}
        <button
          onClick={() => setOpenModal((v) => !v)}
          className="rounded-lg border border-[var(--app-border-strong)] bg-[var(--surface-2)] px-3.5 py-1.5 text-xs font-semibold text-[var(--glow)] transition-colors hover:border-[var(--ultra)]"
        >
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-400" />
          {truncate(address)}
        </button>

        {/* Account Details Modal / Popover */}
        {openModal && (
          <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-[var(--app-border-strong)] bg-[var(--surface)] p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--lilac)]">
                Account Status
              </span>
              <button
                onClick={() => setOpenModal(false)}
                className="text-xs text-[var(--text-dim)] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              <div>
                <span className="text-[var(--text-dim)]">Public Wallet (EOA)</span>
                <p className="font-mono text-[11px] text-[var(--glow)] break-all mt-0.5">
                  {address}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--glow)]">Shield Account Key</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      isUnlocked ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {isUnlocked ? "ACTIVE" : "LOCKED"}
                  </span>
                </div>

                {isUnlocked && keys ? (
                  <div className="mt-2 space-y-2">
                    <div>
                      <span className="text-[10px] text-[var(--text-dimmer)] uppercase">
                        Derived Shield Address
                      </span>
                      <p className="font-mono text-[11px] text-[var(--lilac)] break-all">
                        {keys.privateAddress}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[var(--text-dimmer)] uppercase">
                          Viewing Key (Client-only)
                        </span>
                        <button
                          onClick={() => setShowViewingKey((v) => !v)}
                          className="text-[10px] text-[var(--lilac)] underline"
                        >
                          {showViewingKey ? "Hide" : "Reveal"}
                        </button>
                      </div>
                      <p className="font-mono text-[10px] text-[var(--text-dim)] break-all">
                        {showViewingKey ? keys.viewingKey : "••••••••••••••••••••••••••••••••"}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => copyText("shield", keys.privateAddress)}
                        className="rounded bg-white/10 px-2 py-1 text-[10px] text-[var(--glow)] hover:bg-white/20"
                      >
                        {copied === "shield" ? "Copied!" : "Copy Shield ID"}
                      </button>
                      <button
                        onClick={() => lock()}
                        className="rounded bg-rose-500/20 px-2 py-1 text-[10px] text-rose-300 hover:bg-rose-500/30"
                      >
                        Lock Key
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <p className="text-[11px] text-[var(--text-dim)]">
                      Sign a deterministic message to decrypt notes and authorize private actions.
                    </p>
                    <button
                      onClick={() => unlock()}
                      disabled={isDeriving}
                      className="mt-2 w-full rounded-lg bg-[var(--ultra)] py-1.5 text-center text-xs font-semibold text-white hover:bg-[var(--violet)]"
                    >
                      {isDeriving ? "Signing…" : "Unlock Private Account"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {derivationError && (
              <p className="mt-2 text-[10px] text-rose-400">{derivationError}</p>
            )}

            <div className="mt-4 border-t border-white/10 pt-3">
              <button
                onClick={() => {
                  lock();
                  disconnect();
                  setOpenModal(false);
                }}
                className="w-full rounded-lg border border-white/10 py-1.5 text-center text-xs font-semibold text-rose-300 hover:bg-white/5"
              >
                Disconnect Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpenConnect((v) => !v)}
        disabled={isPending}
        className="rounded-lg bg-[var(--ultra)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--violet)] disabled:opacity-60"
      >
        {isPending ? "Connecting…" : "Connect Wallet"}
      </button>

      {openConnect && !isPending && (
        <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-[var(--app-border-strong)] bg-[var(--surface)] p-2 shadow-xl">
          {connectors.length === 0 && (
            <p className="px-3 py-2 text-xs text-[var(--text-dim)]">
              No wallet detected. Install MetaMask or another browser wallet.
            </p>
          )}
          {connectors.map((c) => (
            <button
              key={c.uid}
              onClick={() => {
                connect({ connector: c, chainId: robinhoodChainTestnet.id });
                setOpenConnect(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--glow)] transition-colors hover:bg-[var(--surface-2)]"
            >
              {c.name}
            </button>
          ))}
          {error && (
            <p className="mt-1 px-3 py-1 text-xs text-rose-400">{error.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
