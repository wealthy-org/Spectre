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
import { IconShield, IconLock, IconClose } from "@/components/app/Icons";
import { formatFriendlyError, isUserRejectedError } from "@/lib/errors";

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
          className="rounded-xl bg-amber-500/90 px-3.5 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-amber-400 disabled:opacity-60"
        >
          {isSwitching ? "Switching…" : "Switch to Robinhood"}
        </button>
      );
    }

    return (
      <div className="relative">
        {/* Unified Sleek Wallet Pill */}
        <button
          onClick={() => setOpenModal((v) => !v)}
          className="flex items-center gap-2 rounded-xl border border-[var(--app-border-strong)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--glow)] transition-all hover:border-[var(--ultra)] hover:bg-[var(--surface-2)]/80"
          title="Account & Shield settings"
        >
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-mono">{truncate(address)}</span>
          </span>

          <span
            className={`hidden sm:inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
              isUnlocked
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
          >
            {isUnlocked ? (
              <>
                <IconShield className="h-3 w-3" />
                <span>Active</span>
              </>
            ) : (
              <>
                <IconLock className="h-3 w-3" />
                <span>Locked</span>
              </>
            )}
          </span>
        </button>

        {/* Unified Account Modal */}
        {openModal && (
          <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-[var(--app-border-strong)] bg-[var(--surface)] p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--lilac)]">
                Account & Shield Keys
              </span>
              <button
                onClick={() => setOpenModal(false)}
                className="text-[var(--text-dim)] hover:text-white transition-colors"
                aria-label="Close"
              >
                <IconClose className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              <div>
                <span className="text-[var(--text-dim)]">Connected EOA Wallet</span>
                <div className="mt-1 flex items-center justify-between rounded-lg bg-black/40 px-2.5 py-1.5">
                  <span className="font-mono text-[11px] text-[var(--glow)]">{truncate(address)}</span>
                  <button
                    onClick={() => copyText("eoa", address)}
                    className="text-[10px] text-[var(--lilac)] hover:underline"
                  >
                    {copied === "eoa" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Shield Section */}
              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--glow)]">Private Account Key</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      isUnlocked ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {isUnlocked ? "DERIVED & READY" : "SESSION LOCKED"}
                  </span>
                </div>

                {isUnlocked && keys ? (
                  <div className="mt-3 space-y-2.5">
                    <div>
                      <span className="text-[10px] text-[var(--text-dimmer)] uppercase">
                        Shield Address (Brief §12)
                      </span>
                      <p className="font-mono text-[11px] text-[var(--lilac)] break-all mt-0.5">
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
                      <p className="font-mono text-[10px] text-[var(--text-dim)] break-all mt-0.5">
                        {showViewingKey ? keys.viewingKey : "••••••••••••••••••••••••••••••••••••••••"}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => copyText("shield", keys.privateAddress)}
                        className="flex-1 rounded-lg bg-white/10 py-1 text-center text-[11px] font-semibold text-[var(--glow)] hover:bg-white/20"
                      >
                        {copied === "shield" ? "Copied!" : "Copy Shield ID"}
                      </button>
                      <button
                        onClick={() => lock()}
                        className="rounded-lg bg-rose-500/20 px-3 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/30"
                      >
                        Lock Key
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2.5">
                    <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">
                      Derive your client-side private account key to view shielded portfolio notes and authorize trade intents.
                    </p>
                    <button
                      onClick={() => unlock()}
                      disabled={isDeriving}
                      className="mt-2.5 w-full rounded-lg bg-[var(--ultra)] py-2 text-center text-xs font-semibold text-white hover:bg-[var(--violet)] disabled:opacity-50"
                    >
                      {isDeriving ? "Signing via Wallet…" : "Derive Shield Key"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {derivationError && !isUserRejectedError(derivationError) && (
              <p className="mt-2 text-[10px] text-rose-400">
                {formatFriendlyError(derivationError, "Key derivation failed")}
              </p>
            )}

            <div className="mt-4 border-t border-white/10 pt-3">
              <button
                onClick={() => {
                  lock();
                  disconnect();
                  setOpenModal(false);
                }}
                className="w-full rounded-lg border border-white/10 py-1.5 text-center text-xs font-semibold text-rose-300 transition-colors hover:bg-white/5"
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
        className="rounded-xl bg-[var(--ultra)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--violet)] disabled:opacity-60"
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
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-[var(--glow)] transition-colors hover:bg-[var(--surface-2)]"
            >
              {c.name}
            </button>
          ))}
          {error && !isUserRejectedError(error) && (
            <p className="mt-1 px-3 py-1 text-xs text-rose-400">
              {formatFriendlyError(error, "Failed to connect wallet")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
