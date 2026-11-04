// Real aquarium plants, lit from the lamp above (dark at the root, bright at the tips, a pale midrib catching the
// light): vallisneria ribbons and stem plants at the back, ferns, sword plants and a carpet of grass in front;
// duckweed floating at the top and specks drifting in the water.

import { art, gradient, make, pick, rand, round } from "./svgkit.js";

const sway = (svg, front) => {
  svg.style.setProperty("--sway", `${round(rand(3.5, 6.5))}s`);
  svg.style.setProperty("--delay", `${-round(rand(0, 6))}s`);
  if (front) svg.classList.add("front");
  return svg;
};

// A long ribbon leaf from (x, h) up to its tip, tapering and bending as it goes.
const ribbon = (x, h, top, width, bend) =>
  `M${round(x - width)} ${h} C${round(x - width + bend)} ${round(h * 0.6)} ${round(x + bend * 1.4)} ${round(top + 30)} ${round(x + bend)} ${round(top)} ` +
  `C${round(x + bend * 1.2 + 2)} ${round(top + 30)} ${round(x + width + bend * 0.8)} ${round(h * 0.6)} ${round(x + width)} ${h} Z`;
const midrib = (x, h, top, bend) => `M${round(x)} ${h} C${round(x + bend)} ${round(h * 0.6)} ${round(x + bend * 1.3)} ${round(top + 30)} ${round(x + bend)} ${round(top + 4)}`;

export const PLANTS = {
  vallisneria(left, height) {
    const svg = art("plant", 50, 160, `left:${left}%; width:${round(rand(34, 48))}px; height:${round(height)}px`);
    const fill = gradient(svg, [[0, "#1f5f30"], [0.55, "#4fa64a"], [1, "#a6e07a"]]);
    for (let k = 0; k < 7; k += 1) {
      const x = rand(14, 36), top = rand(4, 60), bend = rand(-16, 16);
      svg.append(
        make("path", { d: ribbon(x, 160, top, rand(1.6, 2.8), bend), fill, opacity: round(rand(0.75, 1)) }),
        make("path", { d: midrib(x, 160, top, bend), stroke: "#e8ffd0", "stroke-opacity": 0.28, "stroke-width": 0.5, fill: "none" }),
      );
    }
    return sway(svg, false);
  },
  stem(left, height) {
    const svg = art("plant", 40, 160, `left:${left}%; width:${round(rand(26, 34))}px; height:${round(height)}px`);
    const leaf = gradient(svg, [[0, "#2f8a3e"], [1, "#9ad86a"]], { x1: 0, y1: 0, x2: 1, y2: 0 });
    for (let s = 0; s < 2; s += 1) {
      const x = rand(12, 28), top = rand(10, 40);
      svg.append(make("path", { d: `M${round(x)} 160 Q${round(x + rand(-6, 6))} 90 ${round(x + rand(-4, 4))} ${round(top)}`, stroke: "#2b6e36", "stroke-width": 1.6, fill: "none" }));
      for (let y = 150; y > top; y -= 11) { // pairs of small leaves up the stem, smaller and brighter towards the top
        const size = 4 + ((y - top) / 150) * 3;
        svg.append(
          make("ellipse", { cx: round(x - size), cy: y, rx: round(size), ry: 2.1, fill: leaf, transform: `rotate(-24 ${round(x - size)} ${y})` }),
          make("ellipse", { cx: round(x + size), cy: y - 3, rx: round(size), ry: 2.1, fill: leaf, transform: `rotate(24 ${round(x + size)} ${y - 3})` }),
        );
      }
      svg.append(make("circle", { cx: round(x), cy: round(top), r: 2.4, fill: "#b8ec84" })); // the bright new crown
    }
    return sway(svg, false);
  },
  sword(left) {
    const svg = art("plant front", 60, 70, `left:${left}%; width:40px; height:${round(rand(38, 48))}px`);
    const fill = gradient(svg, [[0, "#246b30"], [0.6, "#4fa64a"], [1, "#94d870"]]);
    [-62, -38, -14, 10, 34, 58].forEach((angle) => {
      const turn = `rotate(${angle} 30 70)`;
      svg.append(
        make("path", { d: "M30 70 C18 48 20 18 30 4 C40 18 42 48 30 70 Z", fill, transform: turn }),
        make("path", { d: "M30 68 L30 10 M30 50 L24 40 M30 50 L36 40 M30 34 L25 26 M30 34 L35 26", stroke: "#e8ffd0", "stroke-opacity": 0.35, "stroke-width": 0.7, fill: "none", transform: turn }),
      );
    });
    return sway(svg, true);
  },
  fern(left) {
    const svg = art("plant", 50, 80, `left:${left}%; width:44px; height:${round(rand(56, 72))}px`);
    const fill = gradient(svg, [[0, "#173f22"], [1, "#4f9a4a"]]);
    [-40, -18, 6, 28].forEach((angle) => svg.append(
      make("path", { d: "M25 80 C14 60 12 34 22 8 C26 20 22 28 28 34 C24 44 34 52 26 62 C32 70 28 76 25 80 Z", fill, transform: `rotate(${angle} 25 80)` }),
      make("path", { d: "M25 78 C22 60 20 36 22 12", stroke: "#bfe8a0", "stroke-opacity": 0.3, "stroke-width": 0.6, fill: "none", transform: `rotate(${angle} 25 80)` }),
    ));
    return sway(svg, false);
  },
  carpet(left) {
    const svg = art("plant front carpet", 60, 22, `left:${left}%; width:${round(rand(46, 70))}px; height:${round(rand(14, 20))}px`);
    for (let k = 0; k < 20; k += 1) {
      const x = rand(2, 58), h = rand(6, 20);
      svg.append(make("path", {
        d: `M${round(x)} 22 Q${round(x + rand(-3, 3))} ${round(22 - h / 2)} ${round(x + rand(-4, 4))} ${round(22 - h)}`,
        stroke: pick(["#5cc36f", "#78c850", "#4bb07a", "#9ad86a"]), "stroke-width": 1.6, fill: "none",
      }));
    }
    return sway(svg, true);
  },
};

// The planted garden: a back row of tall plants, ferns, two sword plants and a carpet along the front glass.
export function growPlants(tank) {
  for (let left = -3; left < 100; left += rand(7, 12)) {
    tank.append(PLANTS[Math.random() < 0.7 ? "vallisneria" : "stem"](left, rand(110, 200)));
  }
  [rand(14, 20), rand(78, 86)].forEach((left) => tank.append(PLANTS.fern(left)));
  [rand(24, 28), rand(88, 92)].forEach((left) => tank.append(PLANTS.sword(left)));
  for (let left = -2; left < 100; left += rand(11, 18)) tank.append(PLANTS.carpet(left));
}

// Duckweed: clusters of little round leaves at the surface with roots hanging down; specks drifting in the light.
export function growFloaters(tank) {
  [8, 30, 70].forEach((left) => {
    const svg = art("duckweed", 30, 40, `left:${round(left + rand(0, 6))}%; animation-delay:${-round(rand(0, 9))}s`);
    const fill = gradient(svg, [[0, "#4fae4a"], [1, "#a8e884"]], { cx: 0.4, cy: 0.35 });
    for (let k = 0; k < 5; k += 1) {
      const x = 4 + k * 5.4 + rand(-1, 1), r = rand(2.6, 3.8);
      svg.append(
        make("path", { d: `M${round(x)} ${round(4 + r * 0.2)} q${round(rand(-2, 2))} 12 0 ${round(rand(14, 30))}`, stroke: "#e6ffe0", "stroke-opacity": 0.55, "stroke-width": 0.7, fill: "none" }),
        make("ellipse", { cx: round(x), cy: 4, rx: round(r), ry: round(r * 0.55), fill }),
        make("ellipse", { cx: round(x - r * 0.3), cy: 3.3, rx: round(r * 0.35), ry: 0.6, fill: "#fff", opacity: 0.55 }),
      );
    }
    tank.append(svg);
  });
  for (let k = 0; k < 18; k += 1) {
    const speck = document.createElement("span");
    const size = round(rand(1.5, 3.4));
    speck.className = "speck grown";
    speck.style.cssText = `left:${round(rand(0, 90))}%; top:${round(rand(40, 210))}px; width:${size}px; height:${size}px; --t:${round(rand(10, 20))}s; --d:${-round(rand(0, 20))}s`;
    tank.append(speck);
  }
}
