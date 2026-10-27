export const SPECTRE_SCROLL_MARKUP = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <defs>
    <symbol id="eye" viewBox="0 0 64 28" overflow="visible">
      <polygon points="2,14 16,3 48,3 62,14 48,25 16,25" style="fill:var(--eyebg);stroke:var(--eyest);stroke-width:2.5;stroke-linejoin:round"/>
      <polygon points="32,6 40,14 32,22 24,14" style="fill:var(--eyep)"/>
    </symbol>
    <linearGradient id="gShard" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7B33D0"/><stop offset="1" stop-color="#4B1C96"/></linearGradient>
    <linearGradient id="gBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9C48F0" stop-opacity=".34"/><stop offset="1" stop-color="#9C48F0" stop-opacity="0"/></linearGradient>
    <clipPath id="cHero"><path d="M78,86H458L506,134V532H126L78,484Z"/></clipPath>
    <clipPath id="cProof"><path d="M30,26H530L570,66V590H70L30,550Z"/></clipPath>
  </defs>
</svg>

<header class="bar">
  <a class="brand" href="/" aria-label="Spectre home"><span class="logo" data-logo role="img" aria-label=""></span><span>Spectre</span></a>
  <div class="bar-r">
    <a class="net" href="/docs" style="text-decoration:none">Docs</a>
    <a class="net" href="/proof" style="text-decoration:none">Proof</a>
    <a class="net" href="/privacy" style="text-decoration:none">Privacy</a>
    <a class="net" href="https://x.com/spectreonrh" target="_blank" rel="noopener noreferrer" style="text-decoration:none" title="Follow @spectreonrh on X">𝕏 @spectreonrh</a>
    <span class="net hidden sm:inline">Robinhood Chain</span>
    <a class="btn sm" href="/app">Launch App</a>
  </div>
</header>
<nav class="dots" id="dots" aria-label="Sections"></nav>

<main id="rail">
<div class="stage" id="stage">

<!-- 1 HERO -->
<section class="panel light on" id="p0" aria-label="Introduction">
  <i class="fc a"></i><i class="fc b"></i>
  <div class="wrap">
    <div class="copy">
      <h1>Your portfolio shouldn't be public.</h1>
      <p class="lead">Spectre is a private market layer built for Robinhood Chain. Shield assets, build a private portfolio, and trade through execution waves.</p>
      <div class="chipw"><span class="pip"></span><span>Next trade wave</span><b class="tick-trade">00:42</b></div>
      <div class="cta"><a class="btn" href="/app">Launch App</a><button class="link" data-goto="1">How it works</button></div>
    </div>
    <figure class="art">
      <svg class="scene" id="s0" viewBox="0 0 600 580" role="img" aria-label="A public wallet listing USDG, NVDA, TSLA, AAPL and ETH holdings. Purple shards slide across each row until the portfolio is private.">
        <g id="h-sight" fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="3 7" opacity=".5">
          <path d="M60 86 L104 118"/><path d="M532 250 L512 250"/><path d="M532 440 L512 440"/><path d="M66 330 L84 330"/><path d="M250 50 L250 84"/>
        </g>
        <path d="M92,100H472L520,148V546H140L92,498Z" fill="var(--violet)"/>
        <path d="M78,86H458L506,134V532H126L78,484Z" fill="#fff" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>
        <g id="h-content"></g>
        <g clip-path="url(#cHero)" id="h-shards"></g>
        <g id="h-eyes"></g>
        <image data-logo id="h-logo" x="0" y="0" width="120" height="120"/>
      </svg>
    </figure>
  </div>
  <div class="hint" id="hint"><i></i><span>Scroll</span></div>
</section>

<!-- 2 PROBLEM -->
<section class="panel dark flip" id="p1" aria-label="The problem">
  <i class="fc a"></i><i class="fc b"></i>
  <div class="wrap">
    <div class="copy">
      <h2>A public wallet shows more than you think.</h2>
      <p class="lead">Anyone can read what you hold, what you paid, and when you moved. Put enough of it together and they can read your strategy too.</p>
    </div>
    <figure class="art">
      <svg class="scene" id="s1" viewBox="0 0 600 620" role="img" aria-label="A wallet watched by three eyes. Seven pieces of information are pulled out of it: what you own, how much, when you bought, when you sold, where it moved, position size, and your strategy.">
      </svg>
    </figure>
  </div>
</section>

<!-- 3 SHIELD -->
<section class="panel light b" id="p2" aria-label="Shield assets">
  <i class="fc a"></i><i class="fc b"></i>
  <div class="wrap">
    <div class="copy">
      <h2>Shield assets. Keep your wallet.</h2>
      <p class="lead">Connect the wallet you already use and sign one message. Your assets join a shared pool with everyone else's, and your balance becomes private.</p>
      <p class="fine">Deposits are public onchain actions. What gets harder to follow is everything that happens after them.</p>
    </div>
    <figure class="art">
      <svg class="scene" id="s2" viewBox="0 0 600 620" role="img" aria-label="Coins leave a wallet, mix with many others inside a shared pool, and come out as a private balance.">
      </svg>
    </figure>
  </div>
</section>

<!-- 4 PORTFOLIO -->
<section class="panel iris flip" id="p3" aria-label="Private portfolio">
  <i class="fc a"></i><i class="fc b"></i>
  <div class="wrap">
    <div class="copy">
      <h2>Build a private portfolio.</h2>
      <p class="lead">Hold USDG, ETH, and Stock Tokens like NVDA, TSLA, and AAPL. The chain sees a pool. Only you see your positions.</p>
      <p class="fine">Stock Token support is planned for a small set of liquid assets, added after review.</p>
    </div>
    <figure class="art">
      <div class="seg" role="group" aria-label="Choose a view"><button type="button" aria-pressed="true">What the chain sees</button><button type="button" aria-pressed="false">What you see</button></div>
      <svg class="scene" id="s3" viewBox="0 0 600 630" role="img" aria-label="Two views of the same pool. The chain sees pooled totals and no mapping from people to balances. You see your own holdings and a total of $24,365.">
      </svg>
    </figure>
  </div>
</section>

<!-- 5 TRADE WAVES -->
<section class="panel vivid" id="p4" aria-label="Trade Waves">
  <i class="fc a"></i><i class="fc b"></i>
  <div class="wrap">
    <div class="copy">
      <h2>Trade through waves, not one by one.</h2>
      <p class="lead">Private trade intents collect into a scheduled window. When the wave closes they are netted and executed together, designed so the chain sees one settlement rather than each person's trade.</p>
      <p class="fine">Netting and privacy properties are design targets. They depend on the final execution venue and settlement design.</p>
    </div>
    <figure class="art">
      <svg class="scene" id="s4" viewBox="0 0 640 630" role="img" aria-label="Four private trade intents queue up while a wave timer counts down. When the wave closes the intents are netted into one aggregate execution of $86,420 USDG to NVDA and settled on Robinhood Chain.">
      </svg>
    </figure>
  </div>
</section>

<!-- 6 WITHDRAWALS -->
<section class="panel light flip" id="p5" aria-label="Withdrawal Waves">
  <i class="fc a"></i><i class="fc b"></i>
  <div class="wrap">
    <div class="copy">
      <h2>Withdraw on your terms.</h2>
      <p class="lead">Exits leave in scheduled waves, so a withdrawal is harder to tie to the deposit that funded it. Pick a common amount and it blends in further.</p>
    </div>
    <figure class="art">
      <div class="seg" role="group" aria-label="Choose amounts"><button type="button" aria-pressed="true">Custom amounts</button><button type="button" aria-pressed="false">Standard amounts</button></div>
      <svg class="scene" id="s5" viewBox="0 0 600 620" role="img" aria-label="Four withdrawal requests arrive between 10:03 and 10:12. At 10:15 the wave closes and all four leave together for Robinhood Chain.">
      </svg>
      <p class="note" id="s5-note"></p>
    </figure>
  </div>
</section>

<!-- 7 PROOF -->
<section class="panel dark" id="p6" aria-label="Public proof">
  <i class="fc a"></i><i class="fc b"></i>
  <div class="wrap">
    <div class="copy">
      <h2>Private users. Public accountability.</h2>
      <p class="lead">Every settled wave publishes what the system did: totals, transaction, and a settlement root. Who owned which share stays private.</p>
      <div class="cta"><button class="link" data-goto="7">See what else stays private</button></div>
    </div>
    <figure class="art">
      <svg class="scene" id="s6" viewBox="0 0 600 620" role="img" aria-label="An example public proof for Trade Wave 184 showing aggregate input, output, transactions and a verified status. Below it, three private rows are covered: who owned which share, each user's portfolio, and individual orders.">
      </svg>
    </figure>
  </div>
</section>

<!-- 8 CLOSE -->
<section class="panel light flip" id="p7" aria-label="Get started">
  <i class="fc a"></i><i class="fc b"></i>
  <div class="wrap">
    <div class="copy">
      <h2>Your assets. Your positions. Your business.</h2>
      <p class="lead">Shield assets. Build a private portfolio. Trade through execution waves. Withdraw on your terms.</p>
      <div class="cta"><a class="btn" href="/app">Launch App</a><a class="link" href="/docs">Docs</a><a class="link" href="/privacy">Privacy threat model</a><a class="link" href="/proof">Proof</a><a class="link" href="https://x.com/spectreonrh" target="_blank" rel="noopener noreferrer">𝕏 @spectreonrh</a></div>
      <p class="fine">Preview design. Deposits and withdrawals are public onchain actions, and privacy here means reduced linkage rather than invisibility. The architecture is subject to audit and legal review.</p>
    </div>
    <figure class="art">
      <svg class="scene" id="s7" viewBox="0 0 600 600" role="img" aria-label="The Spectre mask under a beam of light on a faceted pedestal while watching eyes around it close one by one.">
      </svg>
    </figure>
  </div>
</section>

</div>
</main>
`;
