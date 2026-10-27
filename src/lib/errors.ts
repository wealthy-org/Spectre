/**
 * Checks if an error is caused by the user canceling/rejecting a prompt in their wallet.
 */
export function isUserRejectedError(err: unknown): boolean {
  if (!err) return false;

  const errorString =
    typeof err === "string"
      ? err
      : err instanceof Error
      ? `${err.name} ${err.message}`
      : typeof (err as { message?: unknown }).message === "string"
      ? String((err as { message?: unknown }).message)
      : "";

  const lower = errorString.toLowerCase();

  return (
    lower.includes("user rejected") ||
    lower.includes("user denied") ||
    lower.includes("user cancelled") ||
    lower.includes("user canceled") ||
    lower.includes("rejected the request") ||
    lower.includes("action rejected") ||
    (typeof err === "object" &&
      err !== null &&
      "code" in err &&
      ((err as { code: unknown }).code === 4001 ||
        (err as { code: unknown }).code === "ACTION_REJECTED"))
  );
}

/**
 * Returns a clean, user-friendly error message, filtering out technical viem/wagmi stack traces
 * and user-cancelled actions.
 */
export function formatFriendlyError(err: unknown, fallback = "Transaction failed"): string | null {
  if (!err) return null;
  if (isUserRejectedError(err)) return null;

  const raw =
    err instanceof Error
      ? err.message
      : typeof (err as { message?: unknown }).message === "string"
      ? String((err as { message?: unknown }).message)
      : String(err);

  // Take the first line or before 'Version: viem'
  const firstLine = raw.split("\n")[0].split("Version:")[0].trim();
  return firstLine || fallback;
}
