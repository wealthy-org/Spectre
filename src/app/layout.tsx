import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Web3Providers } from "@/components/Web3Providers";

const title = "Spectre | Your portfolio shouldn't be public";
const description =
  "A private market layer built for Robinhood Chain. Shield assets, build a private portfolio, and trade through execution waves.";

export const metadata: Metadata = {
  metadataBase: new URL("https://spectre.app"),
  title,
  description,
  applicationName: "Spectre",
  keywords: [
    "Spectre",
    "Robinhood Chain",
    "private portfolio",
    "Stock Tokens",
    "Trade Waves",
    "shielded pool",
  ],
  openGraph: {
    title,
    description,
    siteName: "Spectre",
    type: "website",
    images: [{ url: "/brand/logo.png" }],
  },
  twitter: {
    card: "summary",
    title,
    description,
    site: "@spectreonrh",
    creator: "@spectreonrh",
    images: ["/brand/logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#150A33",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Hanken+Grotesk:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Web3Providers>{children}</Web3Providers>
      </body>
    </html>
  );
}
