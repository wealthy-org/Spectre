import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation | Spectre",
  description:
    "Official developer and user documentation for Spectre — the private market layer on Robinhood Chain.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="docs-scope">{children}</div>;
}
