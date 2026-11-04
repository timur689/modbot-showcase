// The tank's fixed inhabitants and decorations, drawn in detail: each is lit from the lamp above (light tops,
// shaded feet), with texture where the real thing has it — bricks, planks, scales, spots, polyps.

const DEFS = `
<svg class="defs" width="0" height="0" aria-hidden="true"><defs>
  <linearGradient id="aq-stone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6ecd4"/><stop offset=".5" stop-color="#d8c59e"/><stop offset="1" stop-color="#a08862"/></linearGradient>
  <linearGradient id="aq-foot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b1d0e" stop-opacity="0"/><stop offset="1" stop-color="#2b1d0e" stop-opacity=".45"/></linearGradient>
  <linearGradient id="aq-door" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c130c"/><stop offset="1" stop-color="#4a3626"/></linearGradient>
  <radialGradient id="aq-window" cx=".5" cy=".7" r=".8"><stop offset="0" style="stop-color:var(--window-core)"/><stop offset="1" style="stop-color:var(--window)"/></radialGradient>
  <linearGradient id="aq-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cf9058"/><stop offset=".55" stop-color="#a5663a"/><stop offset="1" stop-color="#6b3f20"/></linearGradient>
  <linearGradient id="aq-lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0a066"/><stop offset="1" stop-color="#9c5e33"/></linearGradient>
  <linearGradient id="aq-iron" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5d6269"/><stop offset=".45" stop-color="#d9dde2"/><stop offset="1" stop-color="#555a61"/></linearGradient>
  <radialGradient id="aq-gold" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff7cc"/><stop offset=".45" stop-color="#ffd24a"/><stop offset="1" stop-color="#bf7f18"/></radialGradient>
  <linearGradient id="aq-coral" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc6d6"/><stop offset=".5" stop-color="#ff7aa2"/><stop offset="1" stop-color="#bf3f68"/></linearGradient>
  <linearGradient id="aq-fan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6a2ff"/><stop offset="1" stop-color="#7d46b8"/></linearGradient>
  <radialGradient id="aq-star" cx=".45" cy=".42" r=".65"><stop offset="0" stop-color="#ffd8b0"/><stop offset=".55" stop-color="#ff9b54"/><stop offset="1" stop-color="#cf5c26"/></radialGradient>
  <linearGradient id="aq-clown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc884"/><stop offset=".5" stop-color="#ff8a2a"/><stop offset="1" stop-color="#d85814"/></linearGradient>
  <linearGradient id="aq-gramma" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffbe2a"/><stop offset=".42" stop-color="#ffd85a"/><stop offset=".56" stop-color="#ab80ff"/><stop offset="1" stop-color="#7448e0"/></linearGradient>
  <linearGradient id="aq-tang" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#78b6ff"/><stop offset=".55" stop-color="#2f6fe0"/><stop offset="1" stop-color="#1a459e"/></linearGradient>
  <radialGradient id="aq-puffer" cx=".45" cy=".35" r=".7"><stop offset="0" stop-color="#fff6c0"/><stop offset=".6" stop-color="#ffd95e"/><stop offset="1" stop-color="#d99a2c"/></radialGradient>
  <radialGradient id="aq-crab" cx=".45" cy=".3" r=".75"><stop offset="0" stop-color="#ffab8f"/><stop offset=".6" stop-color="#ff6a4d"/><stop offset="1" stop-color="#b8361f"/></radialGradient>
  <radialGradient id="aq-snail" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffe9c0"/><stop offset=".6" stop-color="#e8b47a"/><stop offset="1" stop-color="#a36a3e"/></radialGradient>
  <radialGradient id="aq-jelly" cx=".5" cy=".8" r=".85"><stop offset="0" stop-color="#ffe6ff" stop-opacity=".95"/><stop offset=".6" stop-color="#f6a9ff" stop-opacity=".6"/><stop offset="1" stop-color="#d77bff" stop-opacity=".25"/></radialGradient>
  <linearGradient id="aq-tetra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8eaf2"/><stop offset="1" stop-color="#8fb0c0"/></linearGradient>
  <clipPath id="aq-clown-body"><ellipse cx="28" cy="14" rx="17" ry="10.5"/></clipPath>
  <clipPath id="aq-tang-body"><path d="M10 14 C14 3 28 1 38 5 C44 8 45 13 44 16 C42 22 32 27 22 25 C15 23 11 18 10 14 Z"/></clipPath>
  <symbol id="aq-tetra-fish" viewBox="0 0 16 7">
    <path d="M3.4 3.5 L0 .8 L.7 3.5 L0 6.2 Z" fill="#cfe0e8" opacity=".75"/>
    <ellipse cx="9" cy="3.5" rx="6.4" ry="2.6" fill="url(#aq-tetra)"/>
    <path d="M3.6 4.1 Q6.6 6 10.4 5.5 Q7.2 4.5 3.6 4.1 Z" fill="#ff3b6b"/>
    <path d="M3.6 3 Q9 1.5 15 2.9 L15 3.7 Q9 2.5 3.6 3.8 Z" fill="#33e6ff"/>
    <circle cx="13.2" cy="3" r=".8" fill="#1d1d1f"/><circle cx="13.45" cy="2.75" r=".25" fill="#fff"/>
  </symbol>
</defs></svg>`;

const BACKDROP = `
<svg class="backdrop" viewBox="0 0 370 130" preserveAspectRatio="none">
  <path d="M0 130 V78 C34 64 56 84 92 70 C124 58 146 76 186 66 C222 56 250 74 288 62 C318 54 344 66 370 60 V130 Z" style="fill:var(--far)"/>
  <g style="fill:var(--far-plant)">
    <path d="M22 80 C18 50 26 30 20 6 C30 30 30 56 30 80 Z"/><path d="M40 78 C40 56 48 40 46 22 C54 44 50 60 50 78 Z"/>
    <path d="M118 70 C112 44 124 26 116 2 C130 28 128 50 128 70 Z"/><path d="M134 72 C134 54 142 40 140 26 C148 44 144 58 144 72 Z"/>
    <path d="M236 70 C230 44 240 24 234 0 C248 26 246 48 246 70 Z"/><path d="M300 64 C296 44 306 28 302 10 C312 32 310 48 310 64 Z"/>
    <path d="M330 66 C328 50 336 38 334 24 C342 40 340 52 340 66 Z"/>
  </g>
</svg>`;

const RAYS = `<div class="rays">${[[26, -18, 34, -1], [38, -8, 46, -4], [50, 1, 52, -2], [62, 9, 40, -6], [74, 18, 32, -3]]
  .map(([x, angle, width, delay]) => `<i style="--x:${x}%; --a:${angle}deg; --w:${width}px; --d:${delay}s"></i>`).join("")}</div>`;

// Courses of bricks: a line every `step`, joints staggered row by row.
function bricks(x0, x1, y0, y1, step = 6) {
  const lines = [];
  for (let y = y0 + step, row = 0; y < y1; y += step, row += 1) {
    lines.push(`M${x0} ${y} H${x1}`);
    for (let x = x0 + (row % 2 ? 4 : 8); x < x1 - 1; x += 8) lines.push(`M${x} ${y - step} V${y}`);
  }
  return lines.join(" ");
}

const CASTLE = `
<svg class="deco castle" viewBox="0 0 66 80">
  <path d="M33 14 V1" stroke="#6d5a44" stroke-width="1.6" stroke-linecap="round"/>
  <g class="flag"><path d="M33.6 1.4 C38 0 41 4 46 2.8 L45 8.4 C40 9.4 38 6 33.6 8 Z" fill="#ff5d6c"/><path d="M33.6 1.4 C38 0 41 4 46 2.8" fill="none" stroke="#ffa3ac" stroke-width=".8"/></g>
  <g fill="url(#aq-stone)" stroke="#97805e" stroke-width="1.1" stroke-linejoin="round">
    <path d="M6 80 V26 H9.5 V29.5 H12 V26 H16 V29.5 H18.5 V26 H22 V80 Z"/>
    <path d="M44 80 V26 H47.5 V29.5 H50 V26 H54 V29.5 H56.5 V26 H60 V80 Z"/>
    <path d="M22 80 V44 H25 V41 H28 V44 H31 V41 H35 V44 H38 V41 H41 V44 H44 V80 Z"/>
    <path d="M27 44 V16 H29.5 V13 H32 V16 H34 V13 H36.5 V16 H39 V44 Z"/>
  </g>
  <path d="${bricks(6, 22, 30, 80)} ${bricks(44, 60, 30, 80)} ${bricks(22, 44, 44, 80)} ${bricks(27, 39, 16, 44)}" stroke="#7d6644" stroke-opacity=".32" stroke-width=".55"/>
  <g fill="#3c2a12" opacity=".16"><rect x="18" y="26" width="4" height="54"/><rect x="56" y="26" width="4" height="54"/><rect x="35.5" y="13" width="3.5" height="31"/></g>
  <path d="M6 26 H9.5 M12 26 H16 M18.5 26 H22 M44 26 H47.5 M50 26 H54 M56.5 26 H60 M27 13 H29.5 M32 13 H34 M36.5 13 H39 M22 41 H25 M28 41 H31 M35 41 H38 M41 41 H44" stroke="#fffbea" stroke-opacity=".85" stroke-width=".9"/>
  <g fill="url(#aq-window)" stroke="#6d5a44" stroke-width=".8">
    <path class="win" d="M11 48 v-5 a3 3 0 0 1 6 0 v5 Z"/><path class="win" d="M49 48 v-5 a3 3 0 0 1 6 0 v5 Z"/><path class="win" d="M30.5 31 v-4 a2.5 2.5 0 0 1 5 0 V31 Z"/>
  </g>
  <path d="M14 40 V48 M11 44.5 H17 M52 40 V48 M49 44.5 H55 M33 24.5 V31" stroke="#5b4a38" stroke-width=".6"/>
  <path d="M27 80 V68 a6 6 0 0 1 12 0 V80" fill="none" stroke="#b9a37e" stroke-width="1.8"/>
  <path d="M28 80 V68 a5 5 0 0 1 10 0 V80 Z" fill="url(#aq-door)"/>
  <path d="M31.3 64.4 V80 M34.7 64.4 V80" stroke="#000" stroke-opacity=".35" stroke-width=".6"/>
  <circle cx="35.8" cy="73" r="1" fill="none" stroke="#d9b24f" stroke-width=".6"/>
  <rect x="6" y="58" width="54" height="22" fill="url(#aq-foot)"/>
  <path d="M6 80 C8 74 11 77 13 72 C15 76 19 73 22 78 V80 Z M44 80 C46 75 50 78 52 73 C54 77 57 74 60 77 V80 Z" fill="#4f9a4a" opacity=".9"/>
  <g fill="#6fbf5c" opacity=".55"><circle cx="9" cy="62" r="1.3"/><circle cx="20" cy="54" r="1"/><circle cx="47" cy="66" r="1.2"/><circle cx="24" cy="70" r="1.1"/></g>
  <g fill="#f3ead8" opacity=".75"><circle cx="16" cy="68" r=".8"/><circle cx="57" cy="58" r=".7"/><circle cx="41" cy="62" r=".8"/></g>
</svg>
<div class="castle-glow"><i style="left:14px; top:45px"></i><i style="left:52px; top:45px"></i><i style="left:33px; top:28px"></i></div>`;

const CHEST = `
<svg class="deco chest" viewBox="0 0 46 36">
  <ellipse cx="23" cy="17" rx="16" ry="4" fill="#b37a17"/>
  <g fill="url(#aq-gold)" stroke="#a66d12" stroke-width=".4"><circle cx="12.5" cy="15.4" r="3"/><circle cx="18.6" cy="13.8" r="3"/><circle cx="25.4" cy="14" r="3"/><circle cx="32" cy="15.2" r="3"/><circle cx="22" cy="11.2" r="2.7"/></g>
  <circle cx="16.6" cy="10.8" r="1.6" fill="#ff4d6d"/><circle cx="28.6" cy="11.2" r="1.4" fill="#4dd2ff"/>
  <rect x="4" y="16" width="38" height="18" rx="2.5" fill="url(#aq-wood)" stroke="#55301a" stroke-width="1.1"/>
  <path d="M5 22 H41 M5 28 H41" stroke="#55301a" stroke-opacity=".5" stroke-width=".7"/>
  <path d="M13 19 q4 1 6 0 M23 25 q5 1 8 -.4 M14 31 q4 -1 6 0" stroke="#efb47a" stroke-opacity=".55" stroke-width=".5" fill="none"/>
  <rect x="8" y="16" width="3.4" height="18" fill="url(#aq-iron)"/><rect x="34.6" y="16" width="3.4" height="18" fill="url(#aq-iron)"/>
  <g fill="#eef0f3"><circle cx="9.7" cy="19" r=".6"/><circle cx="9.7" cy="31" r=".6"/><circle cx="36.3" cy="19" r=".6"/><circle cx="36.3" cy="31" r=".6"/></g>
  <rect x="19.5" y="17.5" width="7" height="8" rx="1.3" fill="url(#aq-gold)" stroke="#94600f" stroke-width=".6"/>
  <path d="M23 20.4 v2.6" stroke="#4a300a" stroke-width="1.1" stroke-linecap="round"/><circle cx="23" cy="20.2" r=".9" fill="#4a300a"/>
  <rect x="4" y="27" width="38" height="7" rx="2" fill="url(#aq-foot)"/>
  <g class="chest-lid">
    <path d="M4 16 Q4 4 23 4 Q42 4 42 16 Z" fill="url(#aq-lid)" stroke="#55301a" stroke-width="1.1"/>
    <path d="M8 16 V5.6 L11.4 5 V16 Z M34.6 16 V5 L38 5.6 V16 Z" fill="url(#aq-iron)"/>
    <path d="M7.5 9.5 Q23 2.4 38.5 9.5" stroke="#f8cc98" stroke-opacity=".8" stroke-width=".8" fill="none"/>
  </g>
  <g class="sparkle" fill="#fffbe0"><path d="M15 6 l.7 1.7 l1.7 .7 l-1.7 .7 l-.7 1.7 l-.7 -1.7 l-1.7 -.7 l1.7 -.7 Z"/><path d="M30 4.5 l.5 1.3 l1.3 .5 l-1.3 .5 l-.5 1.3 l-.5 -1.3 l-1.3 -.5 l1.3 -.5 Z"/></g>
</svg>
<span class="chest-bubbles"><span class="bubble" style="left:0; bottom:0; animation-delay:-.3s"></span><span class="bubble" style="left:6px; bottom:0; width:6px; height:6px; animation-delay:-2.1s"></span></span>`;

const CORAL_BRANCHES = "M27 62 V32 M27 42 C20 38 15 32 14 22 V12 M27 36 C34 32 39 26 40 18 V8 M14 26 C10 24 7 22 6 18 M40 20 C44 19 47 17 48 14 M27 50 C33 48 37 46 39 40";
const CORAL = `
<svg class="deco coral" viewBox="0 0 54 62">
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="${CORAL_BRANCHES}" stroke="url(#aq-coral)" stroke-width="6"/>
    <path d="${CORAL_BRANCHES}" stroke="#ffe0e8" stroke-opacity=".55" stroke-width="1.3" transform="translate(-1.6 -.4)"/>
  </g>
  <g fill="#ffb3c8"><circle cx="14" cy="11" r="3.6"/><circle cx="40" cy="7" r="3.6"/><circle cx="6" cy="17" r="2.8"/><circle cx="48" cy="13" r="2.8"/><circle cx="39" cy="39" r="2.8"/></g>
  <g fill="#c94a72"><circle cx="14" cy="10.6" r="1.2"/><circle cx="40" cy="6.6" r="1.2"/><circle cx="6" cy="16.8" r=".9"/><circle cx="48" cy="12.8" r=".9"/><circle cx="39" cy="38.8" r=".9"/></g>
  <g fill="#fff4f7" opacity=".85"><circle cx="26" cy="54" r=".6"/><circle cx="28" cy="46" r=".6"/><circle cx="21" cy="37" r=".6"/><circle cx="16" cy="28" r=".6"/><circle cx="33" cy="32" r=".6"/><circle cx="38" cy="24" r=".6"/><circle cx="33" cy="47.5" r=".6"/><circle cx="10" cy="23" r=".5"/><circle cx="44" cy="18.6" r=".5"/></g>
  <path d="M21 62 Q27 55 33 62 Z" fill="#6e2440" opacity=".35"/>
</svg>`;

const FAN = `
<svg class="deco fan" viewBox="0 0 44 54">
  <g fill="none" stroke="url(#aq-fan)" stroke-linecap="round">
    <path d="M22 54 V40 M22 40 C14 32 8 22 6 8 M22 40 C18 28 16 16 16 2 M22 40 C26 28 28 16 30 3 M22 40 C30 32 36 22 38 9 M22 46 C12 42 4 36 2 26 M22 46 C32 42 40 36 42 26" stroke-width="2.2"/>
    <path d="M6 14 C14 12 30 12 38 14 M4 22 C14 19 30 19 40 22 M5 30 C14 27 30 27 39 30 M9 37 C16 35 28 35 35 37" stroke-width=".7" stroke-opacity=".8"/>
  </g>
</svg>`;

const STAR_DOTS = [[13, 9.5], [13, 5.5], [16.8, 12.4], [20.7, 11.3], [15.7, 17.2], [18.3, 20.9], [10.3, 17.2], [7.7, 20.9], [9.2, 12.4], [5.3, 11.3]];
const STAR = `
<svg class="deco star" viewBox="0 0 26 26">
  <path d="M13 1.5 C14 6 15 8.5 16.2 9.6 C18 10.3 21 10 24.5 10.2 C21.6 12.6 19 14.6 18.3 16 C18.5 18.2 19.8 21.4 21 24.6 C17.6 22.4 15 20.6 13 20 C11 20.6 8.4 22.4 5 24.6 C6.2 21.4 7.5 18.2 7.7 16 C7 14.6 4.4 12.6 1.5 10.2 C5 10 8 10.3 9.8 9.6 C11 8.5 12 6 13 1.5 Z" fill="url(#aq-star)" stroke="#b9531d" stroke-width=".6" stroke-linejoin="round"/>
  <g fill="#fff1dc" opacity=".85">${STAR_DOTS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".75"/>`).join("")}</g>
  <circle cx="13" cy="13.6" r="1.7" fill="#d96b33"/>
</svg>`;

const JELLY = `
<svg class="deco jelly" viewBox="0 0 30 44">
  <g class="tentacles" fill="none" stroke="#f6a9ff" stroke-width="1" opacity=".6" stroke-linecap="round"><path d="M5 17 q-3 8 0 16 q3 6 0 10"/><path d="M10 18 q2 9 -1 18"/><path d="M20 18 q-2 9 1 18"/><path d="M25 17 q3 8 0 16 q-3 6 0 10"/></g>
  <g class="arms" fill="#f9c8ff" opacity=".7"><path d="M12 16 C10 22 14 26 11 32 C15 28 16 22 15 16 Z"/><path d="M18 16 C20 22 16 26 19 32 C15 28 14 22 15 16 Z"/></g>
  <path d="M2 17 C2 6 8 1 15 1 C22 1 28 6 28 17 C26 18.5 24 16.5 22 18 C20 16.5 18 18.5 15 17 C12 18.5 10 16.5 8 18 C6 16.5 4 18.5 2 17 Z" fill="url(#aq-jelly)" stroke="#f6c2ff" stroke-width=".6"/>
  <g fill="none" stroke="#e070e8" stroke-width=".9" opacity=".7"><circle cx="10.6" cy="10.4" r="2.1"/><circle cx="19.4" cy="10.4" r="2.1"/><circle cx="15" cy="7.4" r="1.9"/><circle cx="15" cy="13.2" r="1.9"/></g>
  <path d="M6 9 C7 5 10 3 13 2.6" stroke="#fff" stroke-opacity=".85" stroke-width="1.2" fill="none" stroke-linecap="round"/>
</svg>`;

const EYE = (x, y, r = 2.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#1d1d1f"/><circle cx="${x + r * 0.32}" cy="${y - r * 0.32}" r="${r * 0.34}" fill="#fff"/>`;
const SHINE = (d) => `<path d="${d}" stroke="#fff" stroke-opacity=".5" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;

const CLOWN = `
<div class="fish f1 roam"><svg viewBox="0 0 46 28">
  <g class="tail"><path d="M14 14 C8 8 3 4 0 3 C2 8 2 20 0 25 C3 24 8 20 14 14 Z" fill="url(#aq-clown)" stroke="#1d1d1f" stroke-width=".7"/><path d="M3 6 C4 11 4 17 3 22" stroke="#fff" stroke-width="1.2" fill="none"/></g>
  <path d="M20 5 C24 -.5 32 -.5 37 4.5" fill="#ff9a3c" stroke="#1d1d1f" stroke-width=".7"/>
  <path d="M23 23 C25 27.5 31 27.5 32 23" fill="#ff9a3c" stroke="#1d1d1f" stroke-width=".7"/>
  <ellipse cx="28" cy="14" rx="17" ry="10.5" fill="url(#aq-clown)"/>
  <g clip-path="url(#aq-clown-body)" fill="none">
    <path d="M17 2 q4 12 0 24 M27 1 q5 13 0 26 M35 2 q4 12 0 24" stroke="#1d1d1f" stroke-width="4.4"/>
    <path d="M17 2 q4 12 0 24 M27 1 q5 13 0 26 M35 2 q4 12 0 24" stroke="#fff" stroke-width="3"/>
    <ellipse cx="28" cy="20" rx="16" ry="5" fill="#7a2c00" opacity=".12"/>
  </g>
  <path class="fin" d="M31 15 C27 16 25 19 26.5 22 C29.5 20.5 31.5 18 31 15 Z" fill="#ffb066" stroke="#1d1d1f" stroke-width=".5"/>
  ${EYE(39.5, 11)}<path d="M44.6 15.2 q-1 .9 -2.1 .5" stroke="#7a3510" stroke-width=".7" fill="none"/>
  ${SHINE("M21 6.6 Q30 3.4 38 6")}
</svg></div>`;

const GRAMMA = `
<div class="fish f2"><svg viewBox="0 0 46 28">
  <g class="tail"><path d="M14 14 C9 9 4 5 1 4 C3 9 3 19 1 24 C4 23 9 19 14 14 Z" fill="#ffc22e"/><path d="M4 7 L6 14 L4 21" stroke="#ffe08a" stroke-width=".6" fill="none"/></g>
  <path d="M16 7 C22 1.5 33 1 39 5 L36 7 C30 5 22 6 16 9 Z" fill="url(#aq-gramma)" opacity=".9"/>
  <path d="M18 20 C23 25 30 26 35 23 L33 21.5 C28 23 22 22 18 19 Z" fill="url(#aq-gramma)" opacity=".85"/>
  <path d="M12 14 C15 6 26 3.5 34 4.5 C41 5.5 45 10 45 14 C45 18 41 22.5 34 23.5 C26 24.5 15 22 12 14 Z" fill="url(#aq-gramma)"/>
  <path d="M36.5 9.2 L45 12" stroke="#2a1856" stroke-width="1" opacity=".6"/>
  <path d="M18 19 Q30 24 42 18" stroke="#000" stroke-opacity=".08" stroke-width="3" fill="none"/>
  <path class="fin" d="M33 15 C29 16 27 19 28 21 C31 20 33 18 33 15 Z" fill="#cdb0ff" opacity=".9"/>
  ${EYE(39.5, 11.6, 2.3)}
  ${SHINE("M20 7.4 Q30 4.4 40 6.8")}
</svg></div>`;

const TANG = `
<div class="fish f3 roam"><svg viewBox="0 0 46 28">
  <g class="tail"><path d="M11 14 C7 9 3 6 0 5 C2 10 2 18 0 23 C3 22 7 19 11 14 Z" fill="#ffd23a" stroke="#1d1d1f" stroke-width=".6"/></g>
  <path d="M13 9 C18 2 30 0 39 4.5 L37 6 C29 3.5 20 5 14 11 Z" fill="#183c8a" stroke="#0d1530" stroke-width=".5"/>
  <path d="M14 19 C20 25 30 27 38 23 L36 22 C28 24 20 22 15 17 Z" fill="#183c8a" stroke="#0d1530" stroke-width=".5"/>
  <path d="M10 14 C14 3 28 1 38 5 C44 8 45 13 44 16 C42 22 32 27 22 25 C15 23 11 18 10 14 Z" fill="url(#aq-tang)"/>
  <g clip-path="url(#aq-tang-body)">
    <path d="M12 13 C17 6 28 5 35 7.5 C30 9 26 11 24 14 C28 16 31 19 33 23 C25 21.5 17 19 12 13 Z" fill="#141a2e"/>
    <path d="M19 13.2 C23 11 26.5 11.6 28.5 13.2 C26.5 14.8 23 15.2 19 13.2 Z" fill="url(#aq-tang)"/>
  </g>
  <path class="fin" d="M34 15 C30 15.5 28 18 29 20.5 C32 19.5 34 17.5 34 15 Z" fill="#ffd23a"/>
  ${EYE(39, 11.2, 2.3)}
  ${SHINE("M18 6 Q28 2.6 38 6.2")}
</svg></div>`;

const TETRAS = [[4, 7, 0], [24, 17, -0.4], [12, 27, -0.9], [40, 9, -0.2], [52, 23, -0.7], [62, 13, -1.1]];
const SCHOOL = `
<div class="school"><svg viewBox="0 0 80 40">${TETRAS.map(([x, y, delay]) =>
  `<g class="tetra" style="animation-delay:${delay}s"><use href="#aq-tetra-fish" x="${x}" y="${y}" width="16" height="7"/></g>`).join("")}</svg></div>`;

const PUFFER_SPOTS = [[14, 9], [18, 7], [22, 8.5], [12, 13], [16, 11.5], [20, 11], [25, 7.6], [10.5, 17]];
const PUFFER = `
<div class="puffer"><svg viewBox="0 0 34 30">
  <path class="tail" d="M8 15 C4 11 1 9 0 9 C1 12 1 18 0 21 C1 21 4 19 8 15 Z" fill="#e8c35a"/>
  <path d="M17 4.4 C19 1 23 1 25 3.6 Z" fill="#f0c752"/>
  <circle cx="19" cy="15" r="12" fill="url(#aq-puffer)"/>
  <path d="M9 18 C12 26.5 26 27.5 30 19 C26 22.5 14 23 9 18 Z" fill="#fffbe6" opacity=".85"/>
  <g fill="#8a6a1c" opacity=".5">${PUFFER_SPOTS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".95"/>`).join("")}</g>
  <g stroke="#c99a35" stroke-width=".9" stroke-linecap="round"><path d="M19 3 v-2 M27.5 6.5 l1.5 -1.5 M30.8 13 h1.8 M28.6 22.5 l1.4 1.4 M19 27 v2 M10.4 23.5 l-1.4 1.4 M8.6 9 l-1.4 -1.2"/></g>
  <path class="fin" d="M21 16 C19 18 19 21 21 22.5 C22.5 20.5 23 18 21 16 Z" fill="#f3c24a" opacity=".9"/>
  <circle cx="25" cy="12" r="2.8" fill="#fff"/>${EYE(25.6, 12.2, 1.8)}
  <path d="M30.6 16.4 q1.3 .8 0 1.9" stroke="#7a5414" stroke-width=".9" fill="none" stroke-linecap="round"/>
  <ellipse cx="15" cy="8.6" rx="4" ry="1.7" fill="#fff" opacity=".55" transform="rotate(-25 15 8.6)"/>
</svg></div>`;

const CRAB = `
<svg class="crab" viewBox="0 0 34 22">
  <g fill="none" stroke="#c4472f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 15 l-4 1.5 l-2 4"/><path d="M9 17 l-3 2 l-1 3"/><path d="M11 18 l-2 2.5 v2.5"/><path d="M26 15 l4 1.5 l2 4"/><path d="M25 17 l3 2 l1 3"/><path d="M23 18 l2 2.5 v2.5"/></g>
  <path d="M9 12 L5.5 8.5 M25 12 L28.5 8.5" stroke="#e0553a" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M14 9 V5.4 M20 9 V5.4" stroke="#d24d34" stroke-width="1.2"/>${EYE(14, 4.8, 1.6)}${EYE(20, 4.8, 1.6)}
  <path d="M5 13 C5 8 11 7 17 7 C23 7 29 8 29 13 C29 17 23 19 17 19 C11 19 5 17 5 13 Z" fill="url(#aq-crab)" stroke="#a8321e" stroke-width=".6"/>
  <g fill="#ffd2c2" opacity=".55"><circle cx="12" cy="11" r=".9"/><circle cx="17" cy="10" r="1"/><circle cx="22" cy="11" r=".9"/><circle cx="15" cy="13.6" r=".6"/><circle cx="19.5" cy="13.6" r=".6"/></g>
  <path d="M15.5 16 q1.5 1 3 0" stroke="#7a2414" stroke-width=".7" fill="none"/>
  <g class="claw"><path d="M6 10 C1 9 0 4 3 1.5 C4 3.5 5 4 6.5 4 C5 5 5 6.5 7 7 Z" fill="url(#aq-crab)" stroke="#a8321e" stroke-width=".6"/></g>
  <g class="claw right"><path d="M28 10 C33 9 34 4 31 1.5 C30 3.5 29 4 27.5 4 C29 5 29 6.5 27 7 Z" fill="url(#aq-crab)" stroke="#a8321e" stroke-width=".6"/></g>
</svg>`;

const SHRIMP = `
<svg class="shrimp" viewBox="0 0 26 16">
  <g fill="none" stroke="#fff3ee" stroke-width=".5"><path d="M22 6 C26 1 26.5 -1 25 -3"/><path d="M22.5 6.5 C27 4 27.5 2.5 26.5 1.5"/></g>
  <g stroke="#e2735e" stroke-width=".7" stroke-linecap="round"><path d="M12 11 l-1 3 M15 11 v3 M18 10.5 l1 3"/></g>
  <path d="M4 11.5 L.5 14.5 L2 11 L0 9 Z" fill="#ff9d8a"/>
  <path d="M24 8 C22 2 15 1.5 10 3 C4 5 2.5 9 4 11.5 C7 14 11 13 14 11.5 C18 11 22 11 24 8 Z" fill="#ff8a74" opacity=".92"/>
  <path d="M23 6.5 C19 3 13 3 8 5" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".9"/>
  <g stroke="#c9503c" stroke-width=".5" opacity=".6" fill="none"><path d="M10 3.4 q1 4 -1 8.6 M13 2.6 q1 4 0 9.6 M16 2.4 q1 4 0 9"/></g>
  ${EYE(21.5, 5.5, 1.1)}
</svg>`;

const SNAIL = `
<svg class="deco snail" viewBox="0 0 30 22">
  <path d="M2 20 C4 16 10 15.5 18 16.5 L27 17 C28.5 17.5 28.5 20 27 20.5 Z" fill="#dcc39d"/>
  <path d="M4 19.6 C10 18.4 18 18.6 26 19.4" stroke="#fff6e6" stroke-opacity=".6" stroke-width=".6" fill="none"/>
  <path d="M25 17 L27.5 10.5 M26.5 17.5 L29.5 12" stroke="#cdb38c" stroke-width="1.2" stroke-linecap="round"/>
  <circle cx="27.5" cy="10.3" r=".9" fill="#3a2a1a"/><circle cx="29.6" cy="11.8" r=".9" fill="#3a2a1a"/>
  <circle cx="13" cy="11" r="8" fill="url(#aq-snail)" stroke="#8f5a32" stroke-width="1"/>
  <path d="M13 11 m-1 .5 a1.5 1.5 0 1 1 2.6 -1.2 a3.2 3.2 0 1 1 -5.6 2.4 a5 5 0 1 1 8.9 -3.6" fill="none" stroke="#8f5a32" stroke-width="1" stroke-linecap="round"/>
  <g stroke="#a36a3e" stroke-width=".4" opacity=".55"><path d="M7 6 l2 2 M11 3.3 l.6 2.6 M16 3.5 l-1 2.4 M19.6 7 l-2 1.4"/></g>
  <path d="M8 6.5 Q10 4 13 3.6" stroke="#fff6e0" stroke-width="1" fill="none" stroke-linecap="round" opacity=".85"/>
</svg>`;

// A sea anemone: a short column with a crown of tentacles, each ending in a pale tip.
function anemone() {
  const tentacles = Array.from({ length: 13 }, (_, k) => {
    const t = k / 12, x = 9 + t * 22, lean = (t - 0.5) * 22, height = 13 + Math.sin(t * Math.PI) * 6;
    const tipX = (x + lean).toFixed(1), tipY = (22 - height).toFixed(1);
    return { path: `M${x.toFixed(1)} 23 Q${(x + lean * 0.2).toFixed(1)} ${(23 - height * 0.6).toFixed(1)} ${tipX} ${tipY}`, tipX, tipY };
  });
  return `
<svg class="deco anemone" viewBox="0 0 40 34">
  <path d="M12 34 C12 27 14 22 20 22 C26 22 28 27 28 34 Z" fill="#c4576b"/>
  <path d="M14 34 C14 28 16 24 19 23.4" stroke="#f5a3b4" stroke-opacity=".6" stroke-width="1" fill="none"/>
  <g class="tentacles" fill="none" stroke="#ff9cb0" stroke-width="2.4" stroke-linecap="round">${tentacles.map(({ path }) => `<path d="${path}"/>`).join("")}</g>
  <g fill="#ffe0e7">${tentacles.map(({ tipX, tipY }) => `<circle cx="${tipX}" cy="${tipY}" r="1.3"/>`).join("")}</g>
</svg>`;
}

const STREAM = [[3, 0, 9], [5, -1.1, 6], [2, -2.3, 7], [6, -3.4, 5]];
const BUBBLER = `<span class="stone-bubbler"></span>${STREAM.map(([dx, delay, size]) =>
  `<span class="bubble" style="left:calc(46% + ${dx}px); animation-delay:${delay}s; width:${size}px; height:${size}px"></span>`).join("")}`;

// Light and glass over everything: the lamp's tint, its glow from above, darker corners, the surface, the glass.
const LIGHT = `<div class="wash"></div><div class="lampglow"></div><div class="vignette"></div><div class="surface"></div><div class="glass"></div>`;

export function tankMarkup() {
  return [
    DEFS, BACKDROP, FAN, CORAL, CASTLE, JELLY, CLOWN, GRAMMA, TANG, SCHOOL, PUFFER, SNAIL, BUBBLER,
    `<div class="sand"><div class="sand-light"></div></div>`, CHEST, anemone(), CRAB, SHRIMP, STAR, RAYS, LIGHT,
  ].join("");
}
