"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { keccak256, concat, stringToBytes } from "viem";
import { isUserRejectedError } from "@/lib/errors";

export const SPECTRE_DERIVATION_MESSAGE = [
  "PROJECT: Spectre",
  "CHAIN: Robinhood Chain",
  "PURPOSE: Private Account Key Derivation",
  "VERSION: 1",
  "",
  "Sign this message to decrypt your private balance and derive your client-side private account key.",
  "This does not cost any gas and will never be broadcast or stored on any server.",
].join("\n");

export interface DerivedKeys {
  spendingKey: `0x${string}`;
  viewingKey: `0x${string}`;
  privateAddress: `0x${string}`;
  derivedAt: number;
}

interface PrivateAccountContextType {
  isUnlocked: boolean;
  keys: DerivedKeys | null;
  unlock: () => Promise<void>;
  lock: () => void;
  isDeriving: boolean;
  error: string | null;
}

const PrivateAccountContext = createContext<PrivateAccountContextType>({
  isUnlocked: false,
  keys: null,
  unlock: async () => {},
  lock: () => {},
  isDeriving: false,
  error: null,
});

export function PrivateAccountProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [keys, setKeys] = useState<DerivedKeys | null>(null);
  const [isDeriving, setIsDeriving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore from sessionStorage if exists for this connected wallet
  useEffect(() => {
    if (!isConnected || !address) {
      setKeys(null);
      return;
    }
    try {
      const saved = sessionStorage.getItem(`spectre_key_${address.toLowerCase()}`);
      if (saved) {
        setKeys(JSON.parse(saved));
      } else {
        setKeys(null);
      }
    } catch {
      setKeys(null);
    }
  }, [isConnected, address]);

  async function unlock() {
    if (!address) return;
    setIsDeriving(true);
    setError(null);
    try {
      const signature = await signMessageAsync({
        message: SPECTRE_DERIVATION_MESSAGE,
      });

      const spendingKey = keccak256(
        concat([stringToBytes(signature), stringToBytes("::SPECTRE_SPENDING_KEY_V1")])
      );
      const viewingKey = keccak256(
        concat([stringToBytes(signature), stringToBytes("::SPECTRE_VIEWING_KEY_V1")])
      );
      const privateAddress = (
        "0x" + keccak256(concat([stringToBytes(viewingKey), stringToBytes("::ADDRESS_V1")])).slice(26)
      ) as `0x${string}`;

      const derived: DerivedKeys = {
        spendingKey,
        viewingKey,
        privateAddress,
        derivedAt: Date.now(),
      };

      setKeys(derived);
      try {
        sessionStorage.setItem(`spectre_key_${address.toLowerCase()}`, JSON.stringify(derived));
      } catch {
        // Ignore sessionStorage errors
      }
    } catch (err: unknown) {
      if (!isUserRejectedError(err)) {
        setError(err instanceof Error ? err.message : "Failed to derive private account key.");
      }
    } finally {
      setIsDeriving(false);
    }
  }

  function lock() {
    if (address) {
      try {
        sessionStorage.removeItem(`spectre_key_${address.toLowerCase()}`);
      } catch {
        // Ignore
      }
    }
    setKeys(null);
  }

  return (
    <PrivateAccountContext.Provider
      value={{
        isUnlocked: !!keys,
        keys,
        unlock,
        lock,
        isDeriving,
        error,
      }}
    >
      {children}
    </PrivateAccountContext.Provider>
  );
}

export function usePrivateAccount() {
  return useContext(PrivateAccountContext);
}
