// Real aquarium plants, lit from the lamp above (dark at the root, bright at the tips, a pale fold along the midrib):
// vallisneria ribbons and stem plants at the back, ferns and sword plants in the middle, a carpet of grass along the
// front glass, all swaying in the current; duckweed floating at the top and specks drifting in the water.

import { SURFACE } from "./world.js";
import { THREE, color, curve, floorAt, leafy, merge, paint, pick, rand, ribbon, solid, swayByHeight, swaying, tube } from "./kit.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const across = (dir) => V(-dir.z, 0, dir.x).normalize(); // horizontal, at a right angle to `dir`
const heading = (angle) => V(Math.cos(angle), 0, Math.sin(angle));

// One plant: its leaves merged into one swaying mesh standing at (x, z) on the bottom.
function standing(parts, x, z, reach, height) {
  const geometry = swayByHeight(merge(parts), 0, height);
  const mesh = swaying(solid(geometry, leafy()), reach);
  mesh.position.set(x, floorAt(x, z) - 0.05, z);
  return mesh;
}

export const PLANTS = {
  vallisneria(x, z, height, tones = ["#1f5f30", "#a6e07a"]) {
    const leaves = Array.from({ length: 8 }, () => {
      const dir = heading(rand(0, Math.PI * 2)), bend = rand(0.2, 1.1), top = height * rand(0.6, 1);
      const root = V(rand(-0.22, 0.22), 0, rand(-0.12, 0.12));
      const points = curve(root, root.clone().addScaledVector(dir, bend * 0.2).setY(top * 0.55), root.clone().addScaledVector(dir, bend).setY(top), 20);
      const width = rand(0.07, 0.11);
      return ribbon(points, (s) => width * (1 - 0.3 * s) * Math.min(1, (1 - s) * 8 + 0.05), across(dir), { twist: rand(-1.6, 1.6), root: color(tones[0]), tip: color(tones[1]) });
    });
    return standing(leaves, x, z, 0.38, height);
  },
  stem(x, z, height) {
    const parts = [];
    for (let k = 0; k < 2; k += 1) {
      const top = height * rand(0.55, 0.9), lean = V(rand(-0.3, 0.3), 0, rand(-0.15, 0.15));
      const base = V(rand(-0.15, 0.15), 0, rand(-0.1, 0.1));
      const stem = curve(base, base.clone().addScaledVector(lean, 0.4).setY(top * 0.5), base.clone().add(lean).setY(top), 16);
      parts.push(paint(tube(stem, () => 0.022, 6), color("#2b6e36")));
      for (let i = 1; i < stem.length; i += 1) { // pairs of small leaves, each pair turned a quarter from the last
        const at = stem[i], size = 1.4 + (1 - i / stem.length) * 0.8;
        [0, Math.PI].forEach((half) => {
          const dir = heading(i * 1.57 + half).add(V(0, 0.35, 0)).normalize();
          const leaf = curve(at, at.clone().addScaledVector(dir, 0.1 * size).add(V(0, 0.03, 0)), at.clone().addScaledVector(dir, 0.2 * size).add(V(0, 0.01, 0)), 6);
          parts.push(ribbon(leaf, (s) => 0.1 * size * Math.sin(Math.PI * s) ** 0.7 + 0.005, across(dir), { root: color("#2f8a3e"), tip: color("#9ad86a") }));
        });
      }
      const crown = new THREE.IcosahedronGeometry(0.06, 1);
      crown.translate(stem.at(-1).x, stem.at(-1).y, stem.at(-1).z);
      parts.push(paint(crown, color("#b8ec84")));
    }
    return standing(parts, x, z, 0.3, height);
  },
  sword(x, z) {
    const size = rand(0.85, 1.1);
    const leaves = Array.from({ length: 9 }, (_, k) => {
      const dir = heading((k / 9) * Math.PI * 2 + rand(-0.2, 0.2)), rise = rand(0.7, 1.05) * size;
      const points = curve(V(0, 0, 0), dir.clone().multiplyScalar(0.12 * size).setY(rise * 0.55), dir.clone().multiplyScalar(0.55 * size).setY(rise), 16);
      return ribbon(points, (s) => (s < 0.3 ? 0.03 : 0.28 * size * Math.sin((Math.PI * (s - 0.3)) / 0.7) ** 0.8 + 0.02), across(dir), { twist: rand(-0.4, 0.4), fold: 0.25, root: color("#246b30"), tip: color("#94d870") });
    });
    return standing(leaves, x, z, 0.1, 1.1);
  },
  fern(x, z) {
    const leaves = Array.from({ length: 7 }, (_, k) => {
      const dir = heading((k / 7) * Math.PI * 2 + rand(-0.3, 0.3)), length = rand(0.9, 1.3);
      const points = curve(V(0, 0, 0), dir.clone().multiplyScalar(0.2).setY(length * 0.85), dir.clone().multiplyScalar(length * 0.55).setY(length * 0.9), 18);
      return ribbon(points, (s) => 0.22 * Math.sin(Math.PI * s) ** 0.7 * (1 + 0.14 * Math.sin(s * 30)) + 0.01, across(dir), { twist: rand(-0.5, 0.5), fold: 0.3, root: color("#173f22"), tip: color("#4f9a4a") });
    });
    return standing(leaves, x, z, 0.16, 1.3);
  },
  carpet(x, z, width) {
    const blades = Array.from({ length: 80 }, () => {
      const root = V(rand(-width / 2, width / 2), 0, rand(-0.3, 0.3)), dir = heading(rand(0, Math.PI * 2)), h = rand(0.12, 0.32);
      const points = curve(root, root.clone().addScaledVector(dir, 0.03).setY(h * 0.6), root.clone().addScaledVector(dir, rand(0.04, 0.12)).setY(h), 5);
      const tone = pick(["#5cc36f", "#78c850", "#4bb07a", "#9ad86a"]);
      return ribbon(points, (s) => 0.035 * (1 - s) + 0.004, across(dir), { root: color("#2c7a3a"), tip: color(tone) });
    });
    return standing(blades, x, z, 0.08, 0.35);
  },
};

// The planted garden: a hazy far row, a back row of tall plants, ferns, two sword plants and a carpet in front.
export function growPlants(world) {
  const garden = new THREE.Group();
  for (let x = -6.5; x < 6.5; x += rand(1.1, 1.8)) garden.add(PLANTS.vallisneria(x, rand(-4.4, -3.6), rand(4, 6), ["#1d4a3a", "#5d9a72"]));
  for (let x = -6; x < 6; x += rand(0.7, 1.15)) {
    const z = rand(-2.9, -2.2), height = rand(3, 5.2);
    garden.add(Math.random() < 0.7 ? PLANTS.vallisneria(x, z, height) : PLANTS.stem(x, z, height));
  }
  [[rand(-3.4, -3), -1.3], [rand(3.4, 3.8), -1.1]].forEach(([x, z]) => garden.add(PLANTS.fern(x, z)));
  [[rand(-1.9, -1.6), 0.7], [rand(3.5, 3.8), 1.3]].forEach(([x, z]) => garden.add(PLANTS.sword(x, z)));
  for (let x = -5.6; x < 5.8; x += rand(1.1, 1.6)) garden.add(PLANTS.carpet(x, rand(1.55, 1.8), rand(0.8, 1.3)));
  world.add(garden);
  return garden;
}

// Duckweed at the surface: clusters of round leaves with roots hanging down, drifting.
function duckweed(world) {
  [[-3.4, -0.6], [-1, 0.3], [2.3, -0.9]].forEach(([x, z], k) => {
    const cluster = new THREE.Group();
    const leaf = new THREE.MeshStandardMaterial({ color: "#6fbf4f", roughness: 0.5 });
    const roots = [];
    for (let i = 0; i < 6; i += 1) {
      const r = rand(0.07, 0.11), at = V(i * 0.13 + rand(-0.04, 0.04), 0, rand(-0.1, 0.1));
      const pad = solid(new THREE.CylinderGeometry(r, r * 0.9, 0.02, 14), leaf, { receive: false });
      pad.position.copy(at);
      cluster.add(pad);
      roots.push(at.x, 0, at.z, at.x + rand(-0.03, 0.03), -rand(0.25, 0.65), at.z);
    }
    const lines = new THREE.BufferGeometry();
    lines.setAttribute("position", new THREE.Float32BufferAttribute(roots, 3));
    cluster.add(new THREE.LineSegments(lines, new THREE.LineBasicMaterial({ color: "#e6ffe0", transparent: true, opacity: 0.5 })));
    cluster.position.set(x, SURFACE - 0.06, z);
    world.add(cluster);
    world.every((t) => {
      cluster.position.x = x + Math.sin(t * 0.35 + k * 2) * 0.35;
      cluster.rotation.y = Math.sin(t * 0.2 + k) * 0.4;
    });
  });
}

// Specks drifting in the light; at night they glow.
function specks(world) {
  const count = 46;
  const start = Array.from({ length: count }, () => [rand(-5, 5), rand(0.6, 6.4), rand(-2.5, 1.6), rand(0.05, 0.16)]);
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ size: 0.05, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: "#fff0cc" });
  const dust = new THREE.Points(geometry, material);
  dust.frustumCulled = false;
  world.add(dust);
  const day = color("#fff0cc"), night = color("#7ff0ff");
  world.every((t) => {
    start.forEach(([x, y, z, speed], i) => {
      const run = (t * speed + i * 0.37) % 1;
      positions.set([x + run * 1.6, y + run * 1.1 + Math.sin(t + i) * 0.05, z], i * 3);
    });
    geometry.attributes.position.needsUpdate = true;
    material.color.copy(day).lerp(night, world.light.night);
    material.opacity = 0.45 + 0.5 * world.light.night;
    material.size = 0.045 + 0.03 * world.light.night;
  });
}

export function growFloaters(world) {
  duckweed(world);
  specks(world);
}
