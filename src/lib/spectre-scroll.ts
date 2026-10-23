export function runSpectreScroll() {
  if (typeof window === "undefined") return;
  // Guard against React effect double-invoke (dev StrictMode / Fast Refresh)
  // rebuilding the scene DOM twice into the same static SVG shell.
  if ((window as unknown as { __spectreScrollInit?: boolean }).__spectreScrollInit) return;
  (window as unknown as { __spectreScrollInit?: boolean }).__spectreScrollInit = true;

  // Defensive: wipe any dynamically-built content before rebuilding, so a
  // re-run (HMR, StrictMode) can never duplicate shards/rows/eyes.
  // s1..s7 are empty-by-default in the markup (fully script-built), so a
  // full wipe is safe. s0 has permanent static shapes (the wallet card)
  // mixed with named dynamic containers, so only those are cleared.
  ["#s1", "#s2", "#s3", "#s4", "#s5", "#s6", "#s7"].forEach((sel) => {
    const n = document.querySelector(sel);
    if (n) n.innerHTML = "";
  });
  ["#h-content", "#h-shards", "#h-eyes"].forEach((sel) => {
    const n = document.querySelector(sel);
    if (n) n.innerHTML = "";
  });
  const dotsNavExisting = document.querySelector("#dots");
  if (dotsNavExisting) dotsNavExisting.innerHTML = "";

  const NAME = "Spectre";
  const N = 8,
    DW = 0.62,
    THEMES = ["light", "dark", "light", "dark", "dark", "light", "dark", "light"];
  const TITLES = ["Home", "The problem", "Shield", "Portfolio", "Trade Waves", "Withdrawals", "Proof", "Start"];
  const NS = "http://www.w3.org/2000/svg";
  const $ = (s: string, r: ParentNode | Document = document) => r.querySelector(s) as HTMLElement | SVGElement | null;
  const $$ = (s: string, r: ParentNode | Document = document) => [...r.querySelectorAll(s)] as HTMLElement[];
  const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const seg = (d: number, a: number, b: number) => clamp((d - a) / (b - a));
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const eo = (x: number) => 1 - Math.pow(1 - x, 3);
  const eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const el = (tag: string, attrs: Record<string, any>, parent?: Element): any => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txt = (parent: Element, s: string, x: number, y: number, attrs: Record<string, any> = {}) => {
    const t = el("text", Object.assign({ x, y }, attrs), parent);
    t.textContent = s;
    return t;
  };
  const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
  const CH = (w: number, h: number, c = 10) =>
    `${c},0 ${w},0 ${w},${h - c} ${w - c},${h} 0,${h} 0,${c}`;
  const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const LOGO = getComputedStyle(document.documentElement)
    .getPropertyValue("--logo")
    .trim()
    .replace(/^url\(["']?|["']?\)$/g, "");
  $$("[data-logo]").forEach((n) => {
    if (n.tagName.toLowerCase() === "image") n.setAttribute("href", LOGO);
    else (n as HTMLElement).style.backgroundImage = `url("${LOGO}")`;
  });
  void NAME;

  const TOKEN_ICONS: Record<string, string> = {
    USDG: "/tokens/usdg.svg",
    NVDA: "/tokens/nvda.svg",
    TSLA: "/tokens/tsla.svg",
    AAPL: "/tokens/aapl.svg",
    ETH: "/tokens/eth.svg",
  };

  const HOLD: [string, string, number, string, string][] = [
    ["USDG", "$", 8000, "#6024A8", "#fff"],
    ["NVDA", "N", 5143, "#1A0D3D", "#fff"],
    ["TSLA", "T", 3921, "#9C48F0", "#fff"],
    ["AAPL", "A", 3082, "#3C1878", "#fff"],
    ["ETH", "E", 4219, "#C9A2FF", "#1A0D3D"],
  ];
  const TOTAL = 24365;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function mkEye(parent: Element, cx: number, cy: number, w: number): any {
    const g = el("g", {}, parent);
    el("use", { href: "#eye", width: 64, height: 28 }, g);
    g.set = (open: number, op = 1) => {
      const s = w / 64;
      g.setAttribute("transform", `translate(${cx} ${cy}) scale(${s} ${s * Math.max(open, 0.05)}) translate(-32 -14)`);
      g.setAttribute("opacity", op);
    };
    g.set(1);
    return g;
  }
  function mkMask(parent: Element, x: number, y: number, s: number) {
    const i = el("image", { x, y, width: s, height: s }, parent);
    i.setAttribute("href", LOGO);
    return i;
  }

  const clockT = () => {
    const s = 60 - ((Date.now() / 1000) % 60);
    return "00:" + String(Math.floor(s) % 60).padStart(2, "0");
  };
  const clockW = () => {
    const s = 900 - ((Date.now() / 1000) % 900);
    return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(Math.floor(s % 60)).padStart(2, "0");
  };

  const scenes: ((d: number, now: number) => void)[] = [];

  /* ---- 1. hero: ledger gets veiled ---- */
  scenes[0] = ((p: Element) => {
    const content = $("#h-content", p)!,
      shardsG = $("#h-shards", p)!,
      eyesG = $("#h-eyes", p)!,
      sight = $("#h-sight", p)!,
      logo = $("#h-logo", p)!;
    const lab1 = txt(content, "Public wallet", 106, 128, { "font-size": 22, "font-weight": 700, fill: "var(--ink)" });
    const lab2 = txt(content, "Private portfolio", 106, 128, {
      "font-size": 22,
      "font-weight": 700,
      fill: "var(--violet)",
      opacity: 0,
    });
    const addr = txt(content, "0x7a3f…c291", 432, 128, { "font-size": 20, "text-anchor": "end", fill: "rgba(26,13,61,.6)" });
    const addr2 = txt(content, "Only you", 480, 128, { "font-size": 20, "text-anchor": "end", fill: "var(--violet)", opacity: 0 });
    el("line", { x1: 100, x2: 484, y1: 148, y2: 148, stroke: "var(--ink)", "stroke-width": 2 }, content);
    const shards: SVGElement[] = [];
    HOLD.forEach((h, i) => {
      const y0 = 162 + i * 62;
      el("image", { x: 96, y: y0 + 8, width: 36, height: 36, href: TOKEN_ICONS[h[0]] || "" }, content);
      txt(content, h[0], 144, y0 + 24, { "font-size": 22, "font-weight": 700, fill: "var(--ink)" });
      el("rect", { x: 144, y: y0 + 33, width: 140, height: 8, fill: "rgba(156,72,240,.2)" }, content);
      el("rect", { x: 144, y: y0 + 33, width: (140 * h[2]) / 8000, height: 8, fill: "var(--ultra)" }, content);
      txt(content, "$" + fmt(h[2]), 480, y0 + 34, { "font-size": 25, "font-weight": 700, "text-anchor": "end", fill: "var(--ink)" });
      el("line", { x1: 100, x2: 484, y1: y0 + 56, y2: y0 + 56, stroke: "rgba(26,13,61,.15)", "stroke-width": 1.5 }, content);
      shards.push(mkShard(shardsG, y0 - 4, 60));
    });
    txt(content, "Total", 106, 512, { "font-size": 22, "font-weight": 600, fill: "var(--ink)" });
    txt(content, "$" + fmt(TOTAL), 480, 514, { "font-size": 32, "font-weight": 800, "text-anchor": "end", fill: "var(--ink)" });
    const tShard = mkShard(shardsG, 474, 62);
    function mkShard(parent: Element, Y: number, H: number) {
      const g = el("g", {}, parent);
      el("polygon", { points: `90,${Y} 504,${Y} 504,${Y + H} 68,${Y + H}`, fill: "url(#gShard)" }, g);
      el("polygon", { points: `250,${Y} 504,${Y} 504,${Y + H} 212,${Y + H}`, fill: "#9C48F0", opacity: 0.35 }, g);
      mkMask(g, 448, Y + (H - 44) / 2, 44);
      g.setAttribute("transform", "translate(520 0)");
      return g;
    }
    const eyePos: [number, number][] = [
      [38, 70],
      [560, 250],
      [560, 440],
      [38, 330],
      [250, 36],
    ];
    const eyes = eyePos.map(([x, y]) => mkEye(eyesG, x, y, 58));
    const t0 = performance.now();
    return (d: number, now: number) => {
      const intro = rm ? 1 : eio(clamp((now - t0 - 2200) / 3400));
      const v = Math.max(intro, seg(d, 0.3, 0.8));
      shards.forEach((g, j) => {
        const q = eio(seg(v, j * 0.12 + 0.04, j * 0.12 + 0.34));
        g.setAttribute("transform", `translate(${520 * (1 - q)} 0)`);
      });
      tShard.setAttribute("transform", `translate(${520 * (1 - eio(seg(v, 0.62, 0.92)))} 0)`);
      eyes.forEach((e, j) => {
        const q = eo(seg(v, 0.3 + j * 0.09, 0.6 + j * 0.09));
        e.set(1 - q * 0.95, 1 - q);
      });
      sight.setAttribute("opacity", String(0.5 * (1 - seg(v, 0.3, 0.7))));
      const sw = seg(v, 0.45, 0.62);
      lab1.setAttribute("opacity", String(1 - sw));
      lab2.setAttribute("opacity", String(sw));
      addr.setAttribute("opacity", String(1 - sw));
      addr2.setAttribute("opacity", String(sw));
      const lp = eo(seg(v, 0.82, 1));
      logo.setAttribute("transform", `translate(496 62) scale(${0.2 + 0.8 * lp}) translate(-60 -60)`);
      logo.setAttribute("opacity", String(lp));
      const tradeTick = $(".tick-trade", p);
      if (tradeTick) tradeTick.textContent = clockT();
      const h = $("#hint");
      if (h) h.style.opacity = String(1 - seg(d, 0.3, 0.5));
    };
  })($("#p0")!);

  /* ---- 2. problem: tags pulled out of the wallet ---- */
  scenes[1] = ((p: Element) => {
    const svg = $("#s1", p)!,
      cx = 300,
      cy = 310;
    const sight = el("g", { fill: "none", stroke: "var(--lilac)", "stroke-width": 2, "stroke-dasharray": "3 8", opacity: 0.45 }, svg);
    const eyeDefs: [number, number][] = [
      [110, 50],
      [490, 50],
      [300, 590],
    ];
    eyeDefs.forEach(([x, y]) => el("path", { d: `M${x} ${y + (y < 300 ? 18 : -18)} L${cx} ${cy + (y < 300 ? -52 : 52)}` }, sight));
    [0, 1.2, 2.4].forEach((dl) =>
      el(
        "circle",
        { class: "radar", cx, cy, r: 70, fill: "none", stroke: "var(--ultra)", "stroke-width": 2.5, style: `animation-delay:${dl}s` },
        svg
      )
    );
    const leads = el("g", {}, svg);
    const W = el("g", { transform: `translate(${cx} ${cy})` }, svg);
    el("polygon", { points: "-72,-30 -50,-52 72,-52 72,52 -72,52", fill: "var(--iris)", stroke: "var(--lilac)", "stroke-width": 3, "stroke-linejoin": "round" }, W);
    el("polygon", { points: "-72,-30 -50,-52 -8,-52 -30,-30", fill: "var(--ultra)", opacity: 0.55 }, W);
    el("polygon", { points: "72,-14 22,-14 22,22 72,22", fill: "var(--violet)", stroke: "var(--lilac)", "stroke-width": 2 }, W);
    el("circle", { cx: 46, cy: 4, r: 6, fill: "var(--glow)" }, W);
    txt(svg, "0x7a3f…c291", cx, cy + 92, { "font-size": 20, "text-anchor": "middle", fill: "var(--lilac)" });
    const tagDefs: [string, number, number][] = [
      ["What you own", 6, 120],
      ["How much", 6, 230],
      ["When you bought", 6, 340],
      ["When you sold", 6, 450],
      ["Where it moved", 390, 175],
      ["Position size", 390, 285],
      ["Your strategy", 390, 395],
    ];
    const tags = tagDefs.map(([label, x, y], j) => {
      const g = el("g", {}, svg);
      el("polygon", { points: CH(204, 46), fill: "#2B1368", stroke: "var(--lilac)", "stroke-width": 2 }, g);
      el("polygon", { points: "0,10 10,0 22,0 0,22", fill: "var(--ultra)" }, g);
      txt(g, label, 106, 31, { "font-size": 21, "text-anchor": "middle", fill: "var(--glow)" });
      const ex = x < 300 ? x + 204 : x,
        ey = y;
      const lead = el(
        "path",
        { d: `M${cx} ${cy} L${ex} ${ey}`, pathLength: 1, fill: "none", stroke: "var(--ultra)", "stroke-width": 2.5, "stroke-dasharray": 1, "stroke-dashoffset": 1 },
        leads
      );
      return { g, lead, x, y: y - 23, j };
    });
    const eyes = eyeDefs.map(([x, y]) => mkEye(svg, x, y, 84));
    return (d: number, now: number) => {
      tags.forEach((t) => {
        const q = eo(seg(d, 0.08 + t.j * 0.1, 0.32 + t.j * 0.1));
        const x = lerp(cx - 102, t.x, q),
          y = lerp(cy - 23, t.y, q),
          s = lerp(0.3, 1, q);
        t.g.setAttribute("transform", `translate(${x} ${y}) scale(${s})`);
        t.g.setAttribute("opacity", String(clamp(q * 2)));
        t.lead.setAttribute("stroke-dashoffset", String(1 - q));
      });
      const o = eo(seg(d, 0, 0.2));
      eyes.forEach((e, j) => {
        const blink = Math.sin(now / 900 + j * 2.1) > 0.985 ? 0.15 : 1;
        e.set(lerp(0.1, 1, o) * blink, 1);
      });
      sight.setAttribute("opacity", String(0.45 * o));
    };
  })($("#p1")!);

  /* ---- 3. shield: coins fall into the shared pool, come out private ---- */
  scenes[2] = ((p: Element) => {
    const svg = $("#s2", p)!,
      CX = 300,
      PY = 330;
    const W = el("g", { transform: "translate(300 92)" }, svg);
    el("polygon", { points: "-56,-22 -44,-34 56,-34 56,40 -56,40", fill: "#fff", stroke: "var(--ink)", "stroke-width": 3, "stroke-linejoin": "round" }, W);
    el("polygon", { points: "56,-8 16,-8 16,22 56,22", fill: "var(--violet)", stroke: "var(--ink)", "stroke-width": 2.5, "stroke-linejoin": "round" }, W);
    el("circle", { cx: 36, cy: 7, r: 5, fill: "var(--glow)" }, W);
    txt(svg, "Your wallet", 380, 100, { "font-size": 22, fill: "var(--ink)" });
    const sign = el("g", {}, svg);
    el("polygon", { points: CH(130, 40, 9), fill: "var(--ink)" }, sign);
    txt(sign, "Sign once", 65, 27, { "font-size": 20, "text-anchor": "middle", fill: "#fff" });
    el("path", { d: "M130 20 L172 20", stroke: "var(--ink)", "stroke-width": 2.5, "stroke-dasharray": "3 5" }, sign);
    const hp = (ox: number, oy: number) =>
      [
        [300, 225],
        [391, 277.5],
        [391, 382.5],
        [300, 435],
        [209, 382.5],
        [209, 277.5],
      ]
        .map((a) => `${a[0] + ox},${a[1] + oy}`)
        .join(" ");
    el("polygon", { points: hp(10, 10), fill: "var(--violet)" }, svg);
    el("polygon", { points: hp(0, 0), fill: "#fff", stroke: "var(--ink)", "stroke-width": 3, "stroke-linejoin": "round" }, svg);
    el("path", { d: "M300 330 L300 225 M300 330 L391 382.5 M300 330 L209 382.5", stroke: "rgba(96,36,168,.25)", "stroke-width": 2, fill: "none" }, svg);
    const glow = el("polygon", { points: hp(0, 0), fill: "var(--ultra)", opacity: 0 }, svg);
    txt(svg, "Shared pool", 420, 338, { "font-size": 22, fill: "var(--ink)" });
    const dots: { x: number; y: number; ph: number; c: SVGElement }[] = [];
    let seed = 11;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const cols = ["#6024A8", "#9C48F0", "#C9A2FF", "#3C1878"];
    while (dots.length < 40) {
      const x = CX + (rnd() * 2 - 1) * 80,
        y = PY + (rnd() * 2 - 1) * 94,
        dx = Math.abs(x - CX),
        dy = Math.abs(y - PY);
      if (dy > 92 - 0.577 * dx) continue;
      if (dots.some((o) => Math.hypot(o.x - x, o.y - y) < 16)) continue;
      dots.push({ x, y, ph: rnd() * 6.28, c: el("circle", { r: 5.5, fill: cols[dots.length % 4] }, svg) });
    }
    el("polygon", { points: "234,512 382,512 382,600 246,600 234,588", fill: "var(--ink)" }, svg);
    const card = el("polygon", { points: "226,504 374,504 374,592 238,592 226,580", fill: "#fff", stroke: "var(--ink)", "stroke-width": 3, "stroke-linejoin": "round" }, svg);
    const cardMask = mkMask(svg, 261, 513, 78);
    txt(svg, "Private balance", 394, 556, { "font-size": 22, fill: "var(--ink)" });
    const mk = (d: string) => el("path", { d, pathLength: 1, stroke: "var(--ink)", "stroke-width": 2.5, "stroke-dasharray": 1, "stroke-dashoffset": 1, fill: "none" }, svg);
    const l1 = mk("M300 134 L300 225"),
      l2 = mk("M300 435 L300 504");
    const coinDef: [string, string, string][] = [
      ["U", "#6024A8", "#fff"],
      ["N", "#1A0D3D", "#fff"],
      ["E", "#C9A2FF", "#1A0D3D"],
    ];
    const coins = coinDef.map(([l, f, c]) => {
      const g = el("g", {}, svg);
      el("circle", { r: 19, fill: f, stroke: "var(--ink)", "stroke-width": 2.5 }, g);
      txt(g, l, 0, 6, { "font-size": 18, "font-weight": 800, "text-anchor": "middle", fill: c });
      return g;
    });
    const notes = [0, 1, 2].map(() => el("polygon", { points: "0,-9 9,0 0,9 -9,0", fill: "var(--ultra)", stroke: "var(--ink)", "stroke-width": 2 }, svg));
    return (d: number, now: number) => {
      const sq = eo(seg(d, 0.04, 0.2));
      sign.setAttribute("transform", `translate(${40 - 24 * (1 - sq)} 72)`);
      sign.setAttribute("opacity", String(sq));
      l1.setAttribute("stroke-dashoffset", String(1 - seg(d, 0.1, 0.4)));
      l2.setAttribute("stroke-dashoffset", String(1 - seg(d, 0.62, 0.82)));
      coins.forEach((g, j) => {
        const q = seg(d, 0.1 + j * 0.1, 0.42 + j * 0.1),
          e = eio(q);
        const x = lerp(CX + (j - 1) * 38, CX + (j - 1) * 10, e),
          y = lerp(128, PY, e);
        const s = q > 0.8 ? lerp(1, 0.25, (q - 0.8) / 0.2) : 1;
        g.setAttribute("transform", `translate(${x} ${y}) scale(${s})`);
        g.setAttribute("opacity", q <= 0 || q >= 1 ? "0" : "1");
      });
      glow.setAttribute("opacity", String(0.28 * Math.sin(seg(d, 0.4, 0.6) * Math.PI)));
      const amp = 3 * (0.4 + seg(d, 0.3, 0.7));
      dots.forEach((o) => {
        o.c.setAttribute("cx", String(o.x + Math.sin(now / 650 + o.ph) * amp));
        o.c.setAttribute("cy", String(o.y + Math.cos(now / 720 + o.ph) * amp));
      });
      notes.forEach((n, j) => {
        const q = seg(d, 0.6 + j * 0.07, 0.9 + j * 0.03),
          e = eio(q);
        n.setAttribute("transform", `translate(${CX + (j - 1) * 16 * (1 - e)} ${lerp(435, 516, e)})`);
        n.setAttribute("opacity", q <= 0 || q >= 1 ? "0" : "1");
      });
      const ci = eo(seg(d, 0.78, 0.95));
      card.setAttribute("opacity", String(lerp(0.35, 1, ci)));
      cardMask.setAttribute("opacity", String(ci));
    };
  })($("#p2")!);

  /* ---- 4. portfolio: chain view vs your view ---- */
  scenes[3] = ((p: Element) => {
    const svg = $("#s3", p)!,
      btns = $$(".seg button", p);
    el("path", { d: "M32,22H552L592,62V472H72L32,432Z", fill: "var(--violet)" }, svg);
    el("path", { d: "M20,10H540L580,50V460H60L20,420Z", fill: "#fff", stroke: "var(--ink)", "stroke-width": 3, "stroke-linejoin": "round" }, svg);
    const A = el("g", {}, svg),
      B = el("g", {}, svg);
    txt(A, "What the chain sees", 50, 92, { "font-size": 24, "font-weight": 800, fill: "var(--ink)" });
    (
      [
        ["ETH in pool", "1,420"],
        ["Stablecoins in pool", "3.2M"],
        ["NVDA Stock Tokens in pool", "18,400"],
      ] as [string, string][]
    ).forEach(([l, v], i) => {
      const y = 146 + i * 52;
      txt(A, l, 50, y, { "font-size": 22, fill: "rgba(26,13,61,.75)" });
      txt(A, v, 548, y, { "font-size": 26, "font-weight": 800, "text-anchor": "end", fill: "var(--ink)" });
      el("line", { x1: 50, x2: 548, y1: y + 16, y2: y + 16, stroke: "rgba(26,13,61,.15)", "stroke-width": 1.5 }, A);
    });
    txt(A, "Who owns what?", 50, 326, { "font-size": 22, "font-weight": 700, fill: "var(--ink)" });
    ["Alice", "Bob", "Charlie"].forEach((n, i) => {
      const g = el("g", { transform: `translate(${50 + i * 166} 346)` }, A);
      el("polygon", { points: CH(150, 48, 10), fill: "none", stroke: "var(--violet)", "stroke-width": 2.5, "stroke-dasharray": "5 5" }, g);
      txt(g, n + "  ?", 75, 32, { "font-size": 22, "text-anchor": "middle", fill: "var(--violet)" });
    });
    txt(A, "No public map from wallets to balances.", 50, 432, { "font-size": 20, fill: "rgba(26,13,61,.7)" });
    txt(B, "Your private portfolio", 50, 92, { "font-size": 24, "font-weight": 800, fill: "var(--violet)" });
    const bars: SVGElement[] = [],
      amts: SVGElement[] = [];
    HOLD.forEach((h, i) => {
      const y0 = 112 + i * 54;
      el("image", { x: 51, y: y0 + 9, width: 34, height: 34, href: TOKEN_ICONS[h[0]] || "" }, B);
      txt(B, h[0], 98, y0 + 24, { "font-size": 22, "font-weight": 700, fill: "var(--ink)" });
      el("rect", { x: 98, y: y0 + 32, width: 200, height: 8, fill: "rgba(156,72,240,.2)" }, B);
      bars.push(el("rect", { x: 98, y: y0 + 32, width: 0, height: 8, fill: "var(--ultra)" }, B));
      amts.push(txt(B, "$0", 548, y0 + 34, { "font-size": 25, "font-weight": 700, "text-anchor": "end", fill: "var(--ink)" }));
    });
    el("line", { x1: 50, x2: 548, y1: 392, y2: 392, stroke: "var(--ink)", "stroke-width": 2 }, B);
    txt(B, "Total", 50, 436, { "font-size": 22, "font-weight": 600, fill: "var(--ink)" });
    const tot = txt(B, "$0", 548, 438, { "font-size": 32, "font-weight": 800, "text-anchor": "end", fill: "var(--ink)" });
    const w1 = el("g", { transform: "translate(15 488)" }, svg),
      w2 = el("g", { transform: "translate(310 488)" }, svg);
    [
      [w1, 275],
      [w2, 275],
    ].forEach(([g, w]) =>
      el("polygon", { points: CH(w as number, 46, 9), fill: "rgba(235,221,255,.14)", stroke: "var(--lilac)", "stroke-width": 1.5 }, g as Element)
    );
    const t1 = txt(w1, "Trade wave 00:42", 18, 31, { "font-size": 20, fill: "var(--glow)" });
    const t2 = txt(w2, "Withdrawal wave 08:42", 16, 31, { "font-size": 19, fill: "var(--glow)" });
    (
      [
        ["Shield", 15, 125, 1],
        ["Trade", 150, 115, 0],
        ["Send", 275, 105, 0],
        ["Withdraw", 390, 150, 0],
      ] as [string, number, number, number][]
    ).forEach(([l, x, w, pri]) => {
      const g = el("g", { transform: `translate(${x} 560)` }, svg);
      el("polygon", { points: CH(w, 50, 10), fill: pri ? "var(--ultra)" : "none", stroke: pri ? "none" : "var(--lilac)", "stroke-width": 2 }, g);
      txt(g, l, w / 2, 33, { "font-size": 22, "text-anchor": "middle", fill: "var(--glow)" });
    });
    let target = 0,
      m = 0,
      touched = false;
    btns.forEach((b, i) =>
      b.addEventListener("click", () => {
        touched = true;
        target = i;
        btns.forEach((x, k) => x.setAttribute("aria-pressed", String(k === i)));
      })
    );
    return (d: number) => {
      if (d < 0.2) touched = false;
      if (!touched) {
        const nt = d > 0.58 ? 1 : 0;
        if (nt !== target) {
          target = nt;
          btns.forEach((x, k) => x.setAttribute("aria-pressed", String(k === nt)));
        }
      }
      m = rm ? target : m + (target - m) * 0.14;
      if (Math.abs(target - m) < 0.002) m = target;
      A.setAttribute("opacity", String(clamp(1 - m * 2)));
      B.setAttribute("opacity", String(clamp(m * 2 - 1)));
      HOLD.forEach((h, i) => {
        const q = eo(seg(m, 0.4 + i * 0.07, 0.85 + i * 0.03));
        bars[i].setAttribute("width", String((200 * h[2]) / 8000 * q));
        amts[i].textContent = "$" + fmt(h[2] * q);
      });
      tot.textContent = "$" + fmt(TOTAL * eo(seg(m, 0.45, 1)));
      t1.textContent = "Trade wave " + clockT();
      t2.textContent = "Withdrawal wave " + clockW();
    };
  })($("#p3")!);

  /* ---- 5. trade waves ---- */
  scenes[4] = ((p: Element) => {
    const svg = $("#s4", p)!,
      cx = 320,
      cy = 300;
    el("circle", { cx, cy, r: 82, fill: "none", stroke: "rgba(235,221,255,.28)", "stroke-width": 8 }, svg);
    const prog = el("circle", { cx, cy, r: 82, fill: "none", stroke: "#EBDDFF", "stroke-width": 8, "stroke-linecap": "butt", "stroke-dasharray": 515.2, "stroke-dashoffset": 515.2, transform: `rotate(-90 ${cx} ${cy})` }, svg);
    const ripples = [0, 1, 2].map(() => el("circle", { cx, cy, r: 86, fill: "none", stroke: "#EBDDFF", "stroke-width": 3, opacity: 0 }, svg));
    const shades = ["#EBDDFF", "#C9A2FF", "#9C48F0", "#B57BFF", "#8A3FEA", "#D8B8FF"];
    const gem = el("g", {}, svg),
      spin = el("g", { class: "spin" }, gem);
    for (let k = 0; k < 6; k++) {
      const a1 = ((-90 + 60 * k) * Math.PI) / 180,
        a2 = ((-90 + 60 * (k + 1)) * Math.PI) / 180,
        R = 62;
      el(
        "polygon",
        {
          points: `${cx},${cy} ${cx + R * Math.cos(a1)},${cy + R * Math.sin(a1)} ${cx + R * Math.cos(a2)},${cy + R * Math.sin(a2)}`,
          fill: shades[k],
          stroke: "#2C0F66",
          "stroke-width": 1.5,
          "stroke-linejoin": "round",
        },
        spin
      );
    }
    el("circle", { cx, cy, r: 35, fill: "#1E0A4A" }, svg);
    const clk = txt(svg, "0:42", cx, cy + 8, { "font-size": 23, "font-weight": 800, "text-anchor": "middle", fill: "#fff" });
    txt(svg, "Trade Wave #184", cx, 410, { "font-size": 23, "font-weight": 800, "text-anchor": "middle", fill: "#fff" });
    const chipDef: [string, number, number, number][] = [
      ["Alice buys $5,000 NVDA", 165, 36, 0],
      ["Bob sells $8,000 NVDA", 475, 86, 1],
      ["Charlie buys $2,000 NVDA", 165, 136, 0],
      ["David buys $10,000 AAPL", 475, 186, 0],
    ];
    const chips = chipDef.map(([l, x, y, sell], j) => {
      const g = el("g", {}, svg);
      el("polygon", { points: CH(282, 44, 10), fill: sell ? "#C9A2FF" : "#F3EBFF" }, g);
      txt(g, l, 141, 29, { "font-size": 18, "text-anchor": "middle", fill: "#1A0D3D" });
      return { g, x: x - 141, y: y - 22, j };
    });
    const pulses = chips.map(() => el("polygon", { points: "0,-8 8,0 0,8 -8,0", fill: "#EBDDFF" }, svg));
    txt(svg, "Example wave: $100,000 of buys against $70,000 of sells", 320, 438, { "font-size": 19, "text-anchor": "middle", fill: "rgba(255,255,255,.85)" });
    const net = el("g", { transform: "translate(60 448)" }, svg);
    const nMatch = el("g", {}, net),
      nOut = el("g", {}, net);
    el("rect", { width: 364, height: 40, fill: "#F3EBFF" }, nMatch);
    txt(nMatch, "Matched inside the wave", 182, 27, { "font-size": 20, "text-anchor": "middle", fill: "#1A0D3D" });
    el("rect", { x: 364, width: 156, height: 40, fill: "#9C48F0" }, nOut);
    txt(nOut, "Sent out", 442, 27, { "font-size": 20, "text-anchor": "middle", fill: "#fff" });
    const blk = el("g", { transform: "translate(40 504)" }, svg);
    el("polygon", { points: CH(560, 100, 16), fill: "#fff" }, blk);
    txt(blk, "$86,420 USDG → NVDA", 28, 48, { "font-size": 35, "font-weight": 800, fill: "#1A0D3D" });
    txt(blk, "One public settlement on Robinhood Chain", 28, 80, { "font-size": 20, fill: "rgba(26,13,61,.75)" });
    const seal = el("g", { transform: "translate(512 50)" }, blk);
    el("circle", { r: 28, fill: "#9C48F0" }, seal);
    el("path", { d: "M-12 0 L-3 10 L13 -9", stroke: "#fff", "stroke-width": 5, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }, seal);
    return (d: number) => {
      chips.forEach((c, j) => {
        const fall = eo(seg(d, 0.02 + c.j * 0.07, 0.2 + c.j * 0.07)),
          col = seg(d, 0.52 + j * 0.025, 0.68 + j * 0.025);
        c.g.setAttribute("transform", `translate(${c.x} ${lerp(-70, c.y, fall)})`);
        c.g.setAttribute("opacity", String(fall * (1 - 0.5 * eo(seg(col, 0, 0.4)))));
        const e = eio(col);
        pulses[j].setAttribute("transform", `translate(${lerp(c.x + 141, cx, e)} ${lerp(c.y + 44, cy, e)})`);
        pulses[j].setAttribute("opacity", col <= 0 || col >= 1 ? "0" : "1");
      });
      const tp = seg(d, 0.1, 0.55);
      prog.setAttribute("stroke-dashoffset", String(515.2 * (1 - tp)));
      const left = Math.ceil(42 * (1 - tp));
      clk.textContent = left > 0 ? "0:" + String(left).padStart(2, "0") : "Go";
      const rp = seg(d, 0.55, 0.92);
      ripples.forEach((r, k) => {
        const q = clamp(rp * 1.5 - k * 0.3);
        r.setAttribute("r", String(lerp(86, 330, eo(q))));
        r.setAttribute("opacity", q <= 0 || q >= 1 ? "0" : String(0.6 * (1 - q)));
      });
      const flash = Math.sin(seg(d, 0.55, 0.7) * Math.PI);
      gem.setAttribute("transform", `translate(${cx} ${cy}) scale(${1 + 0.1 * flash}) translate(${-cx} ${-cy})`);
      const nq = eo(seg(d, 0.66, 0.8));
      nMatch.setAttribute("transform", `scale(${nq} 1)`);
      nOut.setAttribute("transform", `scale(${nq} 1)`);
      net.setAttribute("opacity", String(clamp(nq * 3)));
      const bq = eo(seg(d, 0.78, 0.95));
      blk.setAttribute("transform", `translate(40 ${504 + 22 * (1 - bq)})`);
      blk.setAttribute("opacity", String(bq));
      const sq = eo(seg(d, 0.9, 1));
      seal.setAttribute("transform", `translate(512 50) scale(${sq})`);
    };
  })($("#p4")!);

  /* ---- 6. withdrawal waves (vertical timeline) ---- */
  scenes[5] = ((p: Element) => {
    const svg = $("#s5", p)!,
      btns = $$(".seg button", p),
      note = $("#s5-note");
    const AX = 190,
      Y0 = 62,
      PM = 24,
      ym = (m: number) => Y0 + PM * m,
      YW = ym(15);
    const MUTED = "rgba(26,13,61,.75)";
    el("line", { x1: AX, x2: AX, y1: Y0, y2: YW + 16, stroke: "var(--ink)", "stroke-width": 3 }, svg);
    [0, 5, 10, 15].forEach((m) => {
      el("line", { x1: AX - 8, x2: AX + 8, y1: ym(m), y2: ym(m), stroke: "var(--ink)", "stroke-width": 2.5 }, svg);
      txt(svg, "10:" + String(m).padStart(2, "0"), AX - 24, ym(m) + 7, { "font-size": 20, "text-anchor": "end", fill: MUTED });
    });
    const band = el("polygon", { points: `150,${YW - 8} 470,${YW - 18} 470,${YW + 6} 150,${YW + 16}`, fill: "var(--ultra)" }, svg);
    txt(svg, "Wave", 484, YW + 6, { "font-size": 22, "font-weight": 800, fill: "var(--violet)" });
    const ph = el("g", {}, svg);
    el("line", { x1: 110, x2: 470, y1: 0, y2: 0, stroke: "var(--violet)", "stroke-width": 2.5, "stroke-dasharray": "4 5" }, ph);
    const pill = el("g", { transform: `translate(${AX - 40} -15)` }, ph);
    el("polygon", { points: CH(80, 30, 8), fill: "var(--violet)" }, pill);
    const clk = txt(pill, "10:00", 40, 22, { "font-size": 18, "font-weight": 800, "text-anchor": "middle", fill: "#fff" });
    const dest = el("g", { transform: "translate(25 562)" }, svg);
    el("polygon", { points: CH(550, 46, 12), fill: "var(--ink)" }, dest);
    txt(dest, "Robinhood Chain", 275, 31, { "font-size": 22, "text-anchor": "middle", fill: "#fff" });
    txt(svg, "All four leave in the same window", 25, 472, { "font-size": 20, fill: MUTED });
    const people: [string, number, string][] = [
      ["Alice", 3, "237"],
      ["Bob", 6, "412"],
      ["Charlie", 9, "905"],
      ["David", 12, "88"],
    ];
    const chips = people.map(([n, m, a], j) => {
      const stem = el("line", { x1: AX, x2: 250, y1: ym(m), y2: ym(m), stroke: "var(--ink)", "stroke-width": 2 }, svg);
      const mark = el("polygon", { points: `${AX},${ym(m) - 7} ${AX + 7},${ym(m)} ${AX},${ym(m) + 7} ${AX - 7},${ym(m)}`, fill: "var(--violet)" }, svg);
      const arrow = el("path", { d: `M${25 + j * 140 + 65} 536 L${25 + j * 140 + 65} 562`, pathLength: 1, stroke: "var(--violet)", "stroke-width": 2.5, "stroke-dasharray": 1, "stroke-dashoffset": 1, fill: "none" }, svg);
      const g = el("g", {}, svg);
      const poly = el("polygon", { points: CH(130, 40, 9), fill: "#fff", stroke: "var(--ink)", "stroke-width": 2.5, "stroke-linejoin": "round" }, g);
      const t = txt(g, n + " " + a, 65, 27, { "font-size": 20, "text-anchor": "middle", fill: "var(--ink)" });
      return { g, stem, mark, arrow, poly, t, m, n, a, j, x0: 250, y0: ym(m) - 20, xo: 25 + j * 140, yo: 492 };
    });
    let target = 0,
      mm = 0,
      touched = false;
    const notes = ["Unique amounts are easier to match to a deposit.", "Common amounts blend into the crowd."];
    const setBtns = (i: number) => btns.forEach((x, k) => x.setAttribute("aria-pressed", String(k === i)));
    btns.forEach((b, i) =>
      b.addEventListener("click", () => {
        touched = true;
        target = i;
        setBtns(i);
      })
    );
    if (note) note.textContent = notes[0];
    return (d: number) => {
      if (d < 0.2) touched = false;
      if (!touched) {
        const nt = d > 0.8 ? 1 : 0;
        if (nt !== target) {
          target = nt;
          setBtns(nt);
        }
      }
      mm = rm ? target : mm + (target - mm) * 0.16;
      if (Math.abs(target - mm) < 0.003) mm = target;
      if (note) note.textContent = notes[mm > 0.5 ? 1 : 0];
      const prog = seg(d, 0.04, 0.5),
        cm = 15 * prog;
      ph.setAttribute("transform", `translate(0 ${ym(cm)})`);
      ph.setAttribute("opacity", String(1 - seg(d, 0.5, 0.6)));
      clk.textContent = "10:" + String(Math.floor(cm)).padStart(2, "0");
      band.setAttribute("opacity", String(0.55 + 0.45 * Math.sin(seg(d, 0.5, 0.64) * Math.PI)));
      const toOut = eio(seg(d, 0.62, 0.8)),
        sent = seg(d, 0.82, 0.96);
      chips.forEach((c) => {
        const arrive = eo(seg(cm, c.m - 0.6, c.m + 0.1));
        const x = lerp(lerp(470, c.x0, arrive), c.xo, toOut),
          y = lerp(c.y0, c.yo, toOut);
        c.g.setAttribute("transform", `translate(${x} ${y})`);
        c.g.setAttribute("opacity", String(arrive));
        c.stem.setAttribute("opacity", String(arrive * (1 - toOut)));
        c.mark.setAttribute("opacity", String(arrive));
        const isStd = mm > 0.5,
          done = sent > 0.5;
        c.t.textContent = c.n + " " + (isStd ? "500" : c.a);
        c.poly.setAttribute("fill", done ? "var(--violet)" : isStd ? "#E3D3FF" : "#fff");
        c.poly.setAttribute("stroke", isStd || done ? "var(--violet)" : "var(--ink)");
        c.t.setAttribute("fill", done ? "#fff" : "var(--ink)");
        c.arrow.setAttribute("stroke-dashoffset", String(1 - eo(seg(sent, 0.1 * c.j, 0.7 + 0.1 * c.j))));
      });
      const pulse = Math.sin(clamp(sent) * Math.PI);
      dest.setAttribute("transform", `translate(300 585) scale(${1 + 0.03 * pulse}) translate(-275 -23)`);
    };
  })($("#p5")!);

  /* ---- 7. proof ---- */
  scenes[6] = ((p: Element) => {
    const svg = $("#s6", p)!;
    el("path", { d: "M42,38H542L582,78V602H82L42,562Z", fill: "var(--violet)" }, svg);
    el("path", { d: "M30,26H530L570,66V590H70L30,550Z", fill: "#F4EFFF", stroke: "var(--ink)", "stroke-width": 3, "stroke-linejoin": "round" }, svg);
    txt(svg, "Trade Wave #184", 62, 86, { "font-size": 30, "font-weight": 800, fill: "var(--ink)" });
    const badge = el("g", { transform: "translate(432 56)" }, svg);
    el("polygon", { points: CH(100, 38, 9), fill: "var(--ink)" }, badge);
    txt(badge, "Example", 50, 26, { "font-size": 19, "text-anchor": "middle", fill: "#fff" });
    txt(svg, "Published onchain", 62, 128, { "font-size": 20, fill: "rgba(26,13,61,.68)" });
    const rows: [string, string][] = [
      ["Aggregate input", "$86,420 USDG"],
      ["Aggregate output", "NVDA Stock Tokens"],
      ["Execution tx", "0x91c4…07ae"],
      ["Settlement root", "0x5be2…d913"],
      ["Status", "Verified"],
    ];
    const pub = rows.map(([l, v], j) => {
      const g = el("g", {}, svg),
        y = 156 + j * 50;
      txt(g, l, 62, y + 26, { "font-size": 21, fill: "rgba(26,13,61,.8)" });
      txt(g, v, 540, y + 26, { "font-size": 22, "font-weight": 800, "text-anchor": "end", fill: j === 4 ? "var(--violet)" : "var(--ink)" });
      el("line", { x1: 62, x2: 540, y1: y + 42, y2: y + 42, stroke: "rgba(26,13,61,.16)", "stroke-width": 1.5 }, g);
      return g;
    });
    const chkIcon = el("g", {}, svg);
    el("polygon", { points: "0,-14 14,-8 14,6 0,16 -14,6 -14,-8", fill: "var(--ultra)" }, chkIcon);
    el("path", { d: "M-6 1 L-1 6 L7 -5", stroke: "#fff", "stroke-width": 3, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }, chkIcon);
    el("line", { x1: 62, x2: 540, y1: 420, y2: 420, stroke: "var(--ink)", "stroke-width": 2, "stroke-dasharray": "6 6" }, svg);
    txt(svg, "Stays private", 62, 456, { "font-size": 20, "font-weight": 700, fill: "var(--violet)" });
    const shG = el("g", { "clip-path": "url(#cProof)" }, svg);
    const priv = ["Who owned which share", "Each user’s portfolio", "Individual orders"].map((l, k) => {
      const y = 470 + k * 38,
        row = el("g", {}, svg);
      txt(row, l, 62, y + 25, { "font-size": 21, fill: "var(--ink)" });
      const sh = el("g", {}, shG);
      el("polygon", { points: `372,${y} 540,${y} 540,${y + 34} 352,${y + 34}`, fill: "url(#gShard)" }, sh);
      el("polygon", { points: `450,${y} 540,${y} 540,${y + 34} 430,${y + 34}`, fill: "#9C48F0", opacity: 0.35 }, sh);
      mkMask(sh, 490, y + 2, 30);
      return sh;
    });
    return (d: number) => {
      pub.forEach((g, j) => {
        const q = eo(seg(d, 0.08 + j * 0.1, 0.24 + j * 0.1));
        g.setAttribute("transform", `translate(${-30 * (1 - q)} 0)`);
        g.setAttribute("opacity", String(q));
      });
      const cq = eo(seg(d, 0.56, 0.68));
      chkIcon.setAttribute("transform", `translate(414 ${156 + 4 * 50 + 20}) scale(${cq})`);
      chkIcon.setAttribute("opacity", String(cq));
      priv.forEach((sh, k) => {
        const q = eio(seg(d, 0.7 + k * 0.07, 0.86 + k * 0.07));
        sh.setAttribute("transform", `translate(${190 * (1 - q)} 0)`);
      });
    };
  })($("#p6")!);

  /* ---- 8. close: the mask, the beam, the eyes ---- */
  scenes[7] = ((p: Element) => {
    const svg = $("#s7", p)!;
    el("polygon", { points: "255,-20 345,-20 590,610 10,610", fill: "url(#gBeam)" }, svg);
    [0, 1.4].forEach((dl) =>
      el("circle", { class: "radar", cx: 300, cy: 310, r: 120, fill: "none", stroke: "var(--ultra)", "stroke-width": 2.5, style: `animation-delay:${dl}s` }, svg)
    );
    el("polygon", { points: "165,498 300,452 435,498 300,544", fill: "var(--violet)", stroke: "var(--ink)", "stroke-width": 3, "stroke-linejoin": "round" }, svg);
    el("polygon", { points: "165,498 300,544 300,572 165,526", fill: "var(--iris)", stroke: "var(--ink)", "stroke-width": 3, "stroke-linejoin": "round" }, svg);
    el("polygon", { points: "435,498 300,544 300,572 435,526", fill: "var(--deep)", stroke: "var(--ink)", "stroke-width": 3, "stroke-linejoin": "round" }, svg);
    const fl = el("g", { class: "float" }, svg);
    const mk = mkMask(fl, 150, 170, 300);
    const eyePos: [number, number][] = [
      [62, 120],
      [540, 160],
      [40, 330],
      [562, 376],
      [110, 538],
      [500, 556],
    ];
    const eyes = eyePos.map(([x, y]) => mkEye(svg, x, y, 64));
    return (d: number, now: number) => {
      eyes.forEach((e, j) => {
        const q = eo(seg(d, 0.1 + j * 0.12, 0.32 + j * 0.12));
        const blink = Math.sin(now / 1000 + j * 1.7) > 0.988 ? 0.2 : 1;
        e.set((1 - q * 0.95) * blink, 1 - q);
      });
      mk.setAttribute("opacity", String(lerp(0.75, 1, eo(seg(d, 0, 0.6)))));
    };
  })($("#p7")!);

  /* ===================== STAGE / SCROLL ENGINE ===================== */
  const stage = $("#stage")!,
    rail = $("#rail")! as HTMLElement,
    panels = $$(".panel"),
    dotsNav = $("#dots")!;
  let H = innerHeight,
    L = H * 1.65,
    eh = H * 0.07,
    cur = -1;
  panels.forEach((pn, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", TITLES[i]);
    b.innerHTML = `<i></i><span>${TITLES[i]}</span>`;
    b.addEventListener("click", () => goTo(i));
    dotsNav.appendChild(b);
  });
  const dotBtns = $$("button", dotsNav);
  function goTo(i: number) {
    if (rm) {
      panels[i].scrollIntoView({ behavior: "auto" });
      return;
    }
    scrollTo({ top: i === 0 ? 0 : (i + 0.5) * L, behavior: "smooth" });
  }
  $$("[data-goto]").forEach((b) => b.addEventListener("click", () => goTo(+(b as HTMLElement).dataset.goto!)));
  addEventListener("keydown", (e) => {
    const target = e.target as HTMLElement;
    if (rm || (target.closest("button,a,input") && e.key === " ")) return;
    if (e.key === "PageDown" || (e.key === " " && !e.shiftKey)) {
      e.preventDefault();
      goTo(Math.min(N - 1, Math.max(cur, 0) + 1));
    } else if (e.key === "PageUp" || (e.key === " " && e.shiftKey)) {
      e.preventDefault();
      goTo(Math.max(0, cur - 1));
    }
  });
  function layout() {
    H = stage.clientHeight || innerHeight;
    L = H * 1.65;
    eh = H * 0.07;
    document.documentElement.style.setProperty("--eh", eh + "px");
    if (!rm) rail.style.height = (N - 1) * L + DW * L + H + "px";
  }
  function setActive(i: number) {
    if (i === cur) return;
    cur = i;
    document.body.dataset.tone = THEMES[i];
    dotBtns.forEach((b, k) => b.setAttribute("aria-current", String(k === i)));
  }
  function frame(now: number) {
    requestAnimationFrame(frame);
    if (rm) {
      const mid = innerHeight * 0.4;
      let idx = 0;
      panels.forEach((pn, i) => {
        const r = pn.getBoundingClientRect();
        if (r.top <= mid) idx = i;
      });
      setActive(idx);
      return;
    }
    const t = clamp(scrollY / L, 0, N - 1 + DW);
    const k = Math.min(N - 1, Math.floor(t)),
      f = t - k;
    const e = k < N - 1 && f > DW ? eio((f - DW) / (1 - DW)) : 0,
      dd = clamp(f / DW);
    panels.forEach((pn, i) => {
      let y = 0,
        veil = 0,
        vis = true,
        d = 0;
      if (i < k) {
        vis = false;
        d = 1;
      } else if (i === k) {
        d = 0.25 + 0.75 * dd;
        y = -e * 0.14 * H;
        veil = e * 0.6;
      } else if (i === k + 1) {
        if (e <= 0) vis = false;
        else {
          y = (1 - e) * (H + eh);
          d = 0.25 * e;
        }
      } else vis = false;
      pn.style.visibility = vis ? "visible" : "hidden";
      if (vis) {
        pn.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
        pn.style.setProperty("--veil", veil.toFixed(3));
        scenes[i](d, now);
      }
      pn.classList.toggle("on", vis);
    });
    setActive(e > 0.5 ? k + 1 : k);
  }
  if (rm) {
    document.documentElement.classList.add("rm");
    scenes.forEach((s) => s(1, performance.now()));
  }
  panels.forEach((pn, i) => {
    if (i) pn.style.visibility = "hidden";
  });
  addEventListener("resize", layout);
  layout();
  scenes.forEach((s, i) => {
    try {
      s(i === 0 ? 0.25 : 0, performance.now());
    } catch (err) {
      console.error("scene", i, err);
    }
  });
  requestAnimationFrame(frame);
}
