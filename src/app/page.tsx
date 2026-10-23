"use client";

import { useEffect } from "react";
import { runSpectreScroll } from "@/lib/spectre-scroll";
import { SPECTRE_SCROLL_MARKUP } from "@/lib/spectre-scroll-markup";

export default function Home() {
  useEffect(() => {
    runSpectreScroll();
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: SPECTRE_SCROLL_MARKUP }} />;
}
