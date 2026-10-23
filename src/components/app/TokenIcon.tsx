import Image from "next/image";

export const TOKEN_ICONS: Record<string, string> = {
  USDG: "/tokens/usdg.svg",
  NVDA: "/tokens/nvda.svg",
  TSLA: "/tokens/tsla.svg",
  AAPL: "/tokens/aapl.svg",
  ETH: "/tokens/eth.svg",
};

interface TokenIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function TokenIcon({ symbol, size = 28, className = "" }: TokenIconProps) {
  const upper = symbol?.toUpperCase() || "ETH";
  const iconSrc = TOKEN_ICONS[upper];

  if (iconSrc) {
    return (
      <span
        className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={iconSrc}
          alt={upper}
          width={size}
          height={size}
          className="h-full w-full object-contain"
          unoptimized
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-xs font-bold text-white ${className}`}
      style={{ width: size, height: size }}
    >
      {upper[0]}
    </span>
  );
}
