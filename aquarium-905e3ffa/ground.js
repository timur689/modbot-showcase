// The bottom: the chosen ground (sand with ripples, gravel or dark soil) with its pebbles, a heap of rocks with
// moss on top, driftwood overgrown with moss and a little fern, shells and moss balls.

import { THREE, color, floorAt, leafy, lump, merge, mix, noise, paint, painted, pick, rand, ribbon, curve, solid, standard, swaying, tube } from "./kit.js";

export const GROUNDS = {
  sand: { colors: ["#f4e0b2", "#e2c78c", "#c4a26a"], ripple: 1, count: 46, size: [0.05, 0.13], stones: ["#c7a26a", "#9aa3ad", "#b6bdc6", "#d48a8a", "#8a7f72", "#efe4cc", "#6d7682"] },
  gravel: { colors: ["#dcd7cd", "#bdb7ab", "#8f887b"], ripple: 0.15, count: 300, size: [0.06, 0.15], stones: ["#d8d4cc", "#b9b4aa", "#8f8a80", "#efebe3", "#a7a196", "#6f6a62", "#c2a98a"] },
  soil: { colors: ["#6e5946", "#4a3a2d", "#2c2119"], ripple: 0.35, count: 220, size: [0.025, 0.07], stones: ["#3b2f25", "#2a211a", "#4a3b2e", "#5c4a39", "#1f1813", "#6b5743"] },
};

const grain = () => painted(256, 256, (ctx, w, h) => {
  ctx.fillStyle = "#f2f2f2";
  ctx.fillRect(0, 0, w, h);
  for (let k = 0; k < 5200; k += 1) {
    const shade = Math.round(rand(170, 255));
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${rand(0.3, 0.9).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(rand(0, w), rand(0, h), rand(0.4, 1.5), 0, Math.PI * 2);
    ctx.fill();
  }
}, { repeat: [16, 6] });

const FRONT_EDGE = 2.05;

function floorMesh() {
  const geometry = new THREE.PlaneGeometry(26, 8.7, 180, 62);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0, -2.25); // ends at the front glass, where the substrate's side shows (aquarium.css)
  const texture = grain();
  const mesh = solid(geometry, standard({ vertexColors: true, map: texture, bumpMap: texture, bumpScale: 1.4, roughness: 0.96 }), { cast: false });
  const shape = (kind) => {
    const { position } = geometry.attributes;
    const ground = GROUNDS[kind];
    for (let i = 0; i < position.count; i += 1) { // the front row drops straight down: the ground's side behind the glass
      const x = position.getX(i), z = position.getZ(i);
      position.setY(i, z > FRONT_EDGE ? -2 : floorAt(x, z, ground.ripple));
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    const [light, middle, dark] = ground.colors.map(color);
    paint(geometry, (x, y, z) => {
      const n = noise(x * 1.3, 0, z * 1.6) * 0.5 + noise(x * 5, 1, z * 5) * 0.25;
      const base = mix(middle, light, 0.5 + n);
      return mix(base, dark, (y - 0.35) * 0.4 + Math.max(0, -n) * 0.6); // the hills at the back darker, hollows darker
    });
  };
  return { mesh, shape };
}

function pebbles(kind) {
  const ground = GROUNDS[kind];
  const geometry = lump(new THREE.IcosahedronGeometry(1, 1), (x, y, z) => 0.12 * noise(x * 3, y * 3, z * 3));
  const mesh = new THREE.InstancedMesh(geometry, standard({ roughness: 0.72 }), ground.count);
  mesh.castShadow = mesh.receiveShadow = true;
  const place = new THREE.Object3D();
  for (let k = 0; k < ground.count; k += 1) {
    const size = rand(...ground.size), x = rand(-6, 6), z = rand(-2.6, 1.95);
    place.position.set(x, floorAt(x, z) + size * 0.15, z);
    place.scale.set(size, size * rand(0.5, 0.75), size * rand(0.7, 1));
    place.rotation.set(rand(-0.2, 0.2), rand(0, Math.PI), rand(-0.2, 0.2));
    place.updateMatrix();
    mesh.setMatrixAt(k, place.matrix);
    mesh.setColorAt(k, color(pick(ground.stones)));
  }
  return mesh;
}

// A lumpy rock: grey, darker where it faces down, moss where the top catches the light.
function rock(scale, [light, dark], seed) {
  const geometry = lump(new THREE.IcosahedronGeometry(1, 3), (x, y, z) =>
    0.2 * noise(x * 1.6 + seed, y * 1.6, z * 1.6) + 0.07 * noise(x * 4.5, y * 4.5 + seed, z * 4.5) - Math.max(0, -y - 0.35) * 0.6);
  geometry.scale(...scale);
  const moss = color("#5fae55"), mossDark = color("#2f6f35");
  paint(geometry, (x, y, z, nx, ny) => {
    const stone = mix(color(dark), color(light), 0.45 + ny * 0.35 + noise(x * 5, y * 5, z * 5) * 0.25);
    const growth = ny > 0.55 && noise(x * 3 + seed, y * 2, z * 3) > -0.1 ? (ny - 0.55) * 2.6 : 0;
    return mix(stone, mix(mossDark, moss, ny), growth);
  });
  return solid(geometry, standard({ vertexColors: true, roughness: 0.88 }));
}

function rocks() {
  const group = new THREE.Group();
  [
    [-0.65, 0.15, [0.62, 0.58, 0.5], ["#dfe4e8", "#565d65"]],
    [0.35, -0.1, [0.72, 0.5, 0.55], ["#e8ecef", "#646b73"]],
    [1.25, 0.25, [0.42, 0.32, 0.38], ["#d0d5da", "#4d535a"]],
  ].forEach(([x, z, scale, tones], k) => {
    const stone = rock(scale, tones, k * 3.1);
    stone.position.set(x, scale[1] * 0.45, z);
    stone.rotation.y = rand(0, Math.PI);
    group.add(stone);
  });
  group.position.set(1.15, floorAt(1.15, 0.35) - 0.12, 0.35);
  return group;
}

// The driftwood's trunk (a curve from its root to its tip) and how thick it is along it; the snail crawls on it.
export const TRUNK = Object.freeze({
  curve: new THREE.QuadraticBezierCurve3(new THREE.Vector3(-4.6, 0.25, 0.1), new THREE.Vector3(-3.2, 0.5, -0.4), new THREE.Vector3(-2.1, 1.75, -0.7)),
  radius: (s) => 0.17 - s * 0.11,
});

function driftwood() {
  const trunk = TRUNK.curve.getPoints(21);
  const branch = curve(new THREE.Vector3(-2.75, 0.95, -0.55), new THREE.Vector3(-2, 1.05, -0.2), new THREE.Vector3(-1.35, 1.45, -0.35), 14);
  const root = curve(new THREE.Vector3(-3.6, 0.45, -0.25), new THREE.Vector3(-3.1, 0.35, 0.3), new THREE.Vector3(-2.6, 0.2, 0.5), 12);
  const bark = [
    tube(trunk, TRUNK.radius, 10),
    tube(branch, (s) => 0.08 - s * 0.05, 8),
    tube(root, (s) => 0.07 - s * 0.04, 8),
  ];
  const wood = merge(bark.map((part) => paint(part, (x, y, z, nx, ny) => {
    const streak = noise(x * 2, y * 14, z * 14) * 0.5 + 0.5;
    return mix(mix(color("#3c2614"), color("#8a5a32"), streak), color("#c79664"), Math.max(0, ny) * 0.35);
  })));
  const group = new THREE.Group();
  group.add(solid(wood, standard({ vertexColors: true, roughness: 0.9 })));
  [[-3.6, 0.62, -0.25], [-2.95, 0.98, -0.5], [-2.45, 1.38, -0.62], [-1.75, 1.2, -0.3], [-1.5, 1.42, -0.35]].forEach(([x, y, z]) => {
    const tuft = lump(new THREE.IcosahedronGeometry(1, 1), (a, b, c) => 0.25 * noise(a * 5, b * 5, c * 5));
    tuft.scale(rand(0.1, 0.16), rand(0.06, 0.09), rand(0.1, 0.14));
    tuft.translate(x, y + 0.08, z);
    group.add(solid(paint(tuft, (a, b, c) => mix(color("#2f7d3a"), color("#8fd06a"), noise(a * 9, b * 9, c * 9) * 0.5 + 0.5)), standard({ vertexColors: true, roughness: 1 })));
  });
  const fern = merge([-0.7, -0.2, 0.3, 0.75].map((turn) => {
    const lean = new THREE.Vector3(Math.sin(turn), 0, Math.cos(turn) * 0.4);
    const points = curve(new THREE.Vector3(0, 0, 0), new THREE.Vector3(lean.x * 0.15, 0.3, lean.z * 0.15), new THREE.Vector3(lean.x * 0.4, 0.55, lean.z * 0.4), 10);
    return ribbon(points, (s) => 0.16 * Math.sin(Math.PI * Math.min(1, s * 1.1)) ** 0.8, new THREE.Vector3(Math.cos(turn), 0, -Math.sin(turn)), { root: color("#173f22"), tip: color("#4f9a4a") });
  }));
  const fernMesh = swaying(solid(fern, leafy()), 0.12);
  fernMesh.position.set(-2.1, 1.72, -0.7);
  group.add(fernMesh);
  return group;
}

const SHELLS = {
  scallop() {
    const geometry = new THREE.SphereGeometry(1, 28, 10, -1.1, 2.2, 0, 1.1);
    const { position } = geometry.attributes;
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i), z = position.getZ(i), angle = Math.atan2(x, z);
      const ribs = 1 + 0.07 * Math.abs(Math.cos(angle * 7));
      position.setXYZ(i, x * ribs, position.getY(i) - 0.45, z * ribs);
    }
    geometry.computeVertexNormals();
    geometry.scale(0.2, 0.22, 0.2);
    paint(geometry, (x, y, z) => mix(color("#d9a98a"), color("#fff1e4"), Math.hypot(x, z) * 4 + noise(x * 40, 0, z * 40) * 0.2));
    return { geometry, rough: 0.5 };
  },
  cowrie() {
    const geometry = lump(new THREE.IcosahedronGeometry(1, 3), () => 0);
    geometry.scale(0.15, 0.09, 0.1);
    paint(geometry, (x, y, z) => {
      const spot = noise(x * 70, y * 70, z * 70) > 0.45;
      return spot ? color("#8a5a34") : mix(color("#c98a5a"), color("#fbe3c4"), y * 6 + 0.5);
    });
    return { geometry, rough: 0.15 };
  },
  spiral() {
    const points = Array.from({ length: 40 }, (_, k) => {
      const turn = (k / 39) * Math.PI * 7, r = 0.1 * (1 - k / 44);
      return new THREE.Vector3(Math.cos(turn) * r, (k / 39) * 0.28, Math.sin(turn) * r);
    });
    const geometry = tube(points, (s) => 0.075 * (1 - s * 0.85), 10);
    geometry.rotateZ(1.35);
    paint(geometry, (x, y, z) => mix(color("#e6b48c"), color("#fff0de"), noise(x * 30, y * 30, z * 30) * 0.5 + 0.5));
    return { geometry, rough: 0.4 };
  },
};

function shells() {
  return [[-2.5, 1.92, "scallop"], [2.1, 1.85, "cowrie"], [3.0, 0.9, "spiral"], [-0.8, 1.95, "scallop"]].map(([x, z, kind]) => {
    const { geometry, rough } = SHELLS[kind]();
    const shell = solid(geometry, standard({ vertexColors: true, roughness: rough }));
    const dx = rand(-0.2, 0.2);
    shell.position.set(x + dx, floorAt(x + dx, z) + 0.02, z);
    shell.rotation.y = rand(-0.8, 0.8);
    return shell;
  });
}

// Moss balls: fuzzy green spheres that slowly breathe.
function mossBalls(world) {
  return [[-2.1, 1.0, 0.2], [2.9, 0.7, 0.16], [0.9, 1.25, 0.13]].map(([x, z, size], k) => {
    const geometry = lump(new THREE.IcosahedronGeometry(1, 3), (a, b, c) => 0.07 * noise(a * 14, b * 14, c * 14) + 0.04 * noise(a * 31, b * 29, c * 33));
    paint(geometry, (a, b, c, nx, ny) => mix(color("#2f7d3a"), color("#a6e07a"), 0.35 + ny * 0.35 + noise(a * 20, b * 20, c * 20) * 0.3));
    const ball = solid(geometry, standard({ vertexColors: true, roughness: 1 }));
    ball.position.set(x, floorAt(x, z) + size * 0.85, z);
    ball.scale.setScalar(size);
    world.every((t) => ball.scale.setScalar(size * (1 + 0.04 * Math.sin(t * 1.25 + k * 2))));
    return ball;
  });
}

// Lays the bottom into the world; `pave(kind)` turns it into another ground.
export function layBottom(world, kind) {
  const floor = floorMesh();
  let stones = null;
  const pave = (next) => {
    const ground = GROUNDS[next] ? next : "sand";
    floor.shape(ground);
    if (stones) {
      world.scene.remove(stones);
      stones.geometry.dispose();
      stones.material.dispose();
    }
    stones = pebbles(ground);
    world.add(stones);
  };
  world.add(floor.mesh, rocks(), driftwood(), ...shells(), ...mossBalls(world));
  pave(kind);
  return { pave };
}

