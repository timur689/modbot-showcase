// The bottom: the chosen ground (sand, gravel or dark soil) with ripples and stones in it, a heap of rocks with moss
// on top, driftwood overgrown with moss and a little fern, shells and moss balls.

import { art, gradient, make, pick, rand, round } from "./svgkit.js";

export const PAVING = {
  sand: { count: 34, size: [3, 9], colors: ["#c7a26a", "#9aa3ad", "#b6bdc6", "#d48a8a", "#8a7f72", "#efe4cc", "#6d7682"] },
  gravel: { count: 64, size: [4, 11], colors: ["#d8d4cc", "#b9b4aa", "#8f8a80", "#efebe3", "#a7a196", "#6f6a62", "#c2a98a"] },
  soil: { count: 110, size: [1.6, 4.4], colors: ["#3b2f25", "#2a211a", "#4a3b2e", "#5c4a39", "#1f1813", "#6b5743"] },
};

// Ripples and stones in the ground, made anew whenever the ground changes.
export function pave(sand, ground) {
  sand.querySelectorAll(".grown").forEach((node) => node.remove());
  const ripples = art("ripples", 100, 40, "position:absolute; inset:0; width:100%; height:100%");
  ripples.setAttribute("preserveAspectRatio", "none");
  for (let y = 12; y < 40; y += 7) {
    ripples.append(make("path", { d: `M0 ${y} Q25 ${y - 3} 50 ${y} T100 ${y}`, style: "stroke:var(--ripple)", "stroke-width": 0.8, fill: "none" }));
  }
  sand.append(ripples);
  const { count, size: [small, big], colors } = PAVING[ground] ?? PAVING.sand;
  for (let k = 0; k < count; k += 1) {
    const stone = document.createElement("i");
    const size = rand(small, big);
    stone.className = "grown";
    stone.style.cssText = `left:${round(rand(1, 97))}%; top:${round(rand(8, 36))}px; width:${round(size)}px; height:${round(size * rand(0.55, 0.85))}px; background-color:${pick(colors)}`;
    sand.append(stone);
  }
}

function rocks(tank) {
  const svg = art("deco rocks", 120, 50, "left:52%; bottom:18px; width:110px; height:46px");
  const shapes = [
    ["M6 50 C6 36 12 24 22 16 C30 10 44 10 52 18 C58 26 60 38 60 50 Z", ["#d2d8de", "#8d959e", "#565d65"]],
    ["M44 50 C46 38 52 26 64 20 C76 16 90 20 96 30 C100 38 102 44 102 50 Z", ["#dfe4e8", "#a3abb4", "#646b73"]],
    ["M86 50 C88 42 94 34 104 32 C112 32 117 40 118 50 Z", ["#c3c9cf", "#7c848d", "#4d535a"]],
  ];
  shapes.forEach(([d, [light, mid, dark]]) => {
    const fill = gradient(svg, [[0, light], [0.55, mid], [1, dark]], { cx: 0.35, cy: 0.2, r: 0.95 });
    svg.append(make("path", { d, fill, stroke: "rgba(0,0,0,0.18)", "stroke-width": 0.8 }));
  });
  svg.append(
    make("path", { d: "M28 22 l4 9 l-3 7 M70 26 l3 6 l5 3 M100 38 l3 6", stroke: "rgba(30,34,40,0.45)", "stroke-width": 0.8, fill: "none", "stroke-linecap": "round" }),
    make("path", { d: "M16 26 C22 18 30 14 38 14 M56 26 C62 20 70 18 78 19", stroke: "rgba(255,255,255,0.6)", "stroke-width": 1.6, fill: "none", "stroke-linecap": "round" }),
    make("path", { d: "M22 17 C26 13 32 11 38 12 C36 15 30 16 26 18 Z M60 22 C66 18 74 17 80 18 C76 21 68 22 62 24 Z M98 33 C102 31 106 31 108 33 C105 34 101 35 98 35 Z", fill: "#5fae55", opacity: 0.85 }),
    make("rect", { x: 0, y: 38, width: 120, height: 12, fill: "rgba(20,24,30,0.22)" }),
  );
  tank.append(svg);
}

function driftwood(tank) {
  const svg = art("deco driftwood", 140, 60, "left:2%; bottom:22px; width:130px; height:56px");
  const trunk = "M4 56 C30 50 46 40 62 22 C68 14 76 8 84 4";
  const branches = "M62 22 C80 26 96 22 112 12 M40 46 C52 46 60 52 70 58";
  svg.append(
    make("path", { d: `${trunk} ${branches}`, stroke: "#4f321c", "stroke-width": 7.5, "stroke-linecap": "round", fill: "none" }),
    make("path", { d: `${trunk} ${branches}`, stroke: "#86562f", "stroke-width": 5, "stroke-linecap": "round", fill: "none" }),
    make("path", { d: trunk, stroke: "#c79664", "stroke-width": 1.6, "stroke-linecap": "round", fill: "none", transform: "translate(-.6 -1.8)" }),
    make("path", { d: "M20 52 C30 48 36 44 44 38 M70 22 C80 24 90 22 100 16", stroke: "#3c2614", "stroke-opacity": 0.5, "stroke-width": 0.6, fill: "none" }),
    make("ellipse", { cx: 52, cy: 33, rx: 2.2, ry: 1.4, fill: "#3c2614", transform: "rotate(-40 52 33)" }),
    make("ellipse", { cx: 92, cy: 20, rx: 1.8, ry: 1.2, fill: "#3c2614" }),
  );
  [[30, 48], [48, 36], [58, 26], [96, 19], [106, 14]].forEach(([x, y]) => { // tufts of moss on the wood
    for (let k = 0; k < 5; k += 1) svg.append(make("circle", { cx: round(x + rand(-4, 4)), cy: round(y + rand(-3, 1)), r: round(rand(1.2, 2.2)), fill: pick(["#4f9a4a", "#6fbf5c", "#3d8040"]) }));
  });
  const leaf = gradient(svg, [[0, "#1f5a2e"], [1, "#5fae55"]]);
  [-30, -8, 14].forEach((angle) => svg.append(make("path", { d: "M76 10 C70 2 72 -10 78 -16 C82 -8 82 2 76 10 Z", fill: leaf, transform: `rotate(${angle} 76 10)` })));
  svg.style.overflow = "visible";
  tank.append(svg);
}

const SHELLS = {
  scallop(svg) {
    const fill = gradient(svg, [[0, "#d9a98a"], [1, "#fff1e4"]]);
    svg.append(
      make("path", { d: "M8 12 L1 4 C2 1 5 0 8 0 C11 0 14 1 15 4 Z", fill, stroke: "#b98a68", "stroke-width": 0.6 }),
      make("path", { d: "M8 12 L3 1.6 M8 12 L5.4 .4 M8 12 V0 M8 12 L10.6 .4 M8 12 L13 1.6", stroke: "#b98a68", "stroke-width": 0.5 }),
      make("path", { d: "M6 12 H10 L9 13.4 H7 Z", fill: "#c89a78" }),
    );
  },
  spiral(svg) {
    const fill = gradient(svg, [[0, "#e6b48c"], [1, "#fff0de"]], { cx: 0.4, cy: 0.35 });
    svg.append(
      make("path", { d: "M2 12 C0 7 3 2 8 2 C12 2 15 5 14 9 C13 12 10 13 7 12 C5 11 5 8 7 7.5", fill, stroke: "#b98a68", "stroke-width": 0.7 }),
      make("path", { d: "M7 7.5 C9 7 10.5 9 9 10.2", stroke: "#b98a68", "stroke-width": 0.6, fill: "none" }),
      make("path", { d: "M4 5 C6 3 9 3 11 4", stroke: "#fff", "stroke-opacity": 0.7, "stroke-width": 0.7, fill: "none" }),
    );
  },
  cowrie(svg) {
    const fill = gradient(svg, [[0, "#c98a5a"], [1, "#fbe3c4"]]);
    svg.append(
      make("ellipse", { cx: 8, cy: 8, rx: 7, ry: 4.6, fill, stroke: "#a87650", "stroke-width": 0.6 }),
      make("path", { d: "M2.6 9.4 Q8 11 13.4 9.4", stroke: "#7a4f2e", "stroke-width": 0.8, fill: "none" }),
      ...[[5, 6], [8, 5], [11, 6.4], [6.6, 7.6], [9.6, 7.4]].map(([cx, cy]) => make("circle", { cx, cy, r: 0.5, fill: "#8a5a34", opacity: 0.6 })),
      make("ellipse", { cx: 6, cy: 5.2, rx: 2.4, ry: 0.8, fill: "#fff", opacity: 0.6 }),
    );
  },
};

function shells(tank) {
  [[26, "scallop"], [74, "cowrie"], [90, "spiral"], [44, "scallop"]].forEach(([left, kind]) => {
    const svg = art("deco shell", 16, 14, `left:${round(left + rand(-2, 2))}%; bottom:${round(rand(8, 12))}px; width:16px; height:14px`);
    SHELLS[kind](svg);
    tank.append(svg);
  });
}

function mossBalls(tank) {
  [[24, 16], [82, 13], [60, 10]].forEach(([left, size]) => {
    const moss = document.createElement("span");
    moss.className = "moss grown";
    moss.style.cssText = `left:${left}%; width:${size}px; height:${size}px; animation-delay:${-round(rand(0, 5))}s`;
    tank.append(moss);
  });
}

export function growBottom(tank) {
  rocks(tank);
  driftwood(tank);
  shells(tank);
  mossBalls(tank);
}
