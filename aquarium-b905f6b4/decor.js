// The tank's decorations in 3D: a sandstone castle with lit windows and a flag, a treasure chest that opens now
// and then, a branching coral and a sea fan, an anemone, a starfish, and the airstone with its stream of bubbles.

import { AIRSTONE } from "./equipment.js";
import { halo } from "./water.js";
import { SURFACE } from "./world.js";
import { THREE, color, curve, floorAt, leafy, merge, mix, paint, painted, rand, solid, standard, swayByHeight, swaying, tube } from "./kit.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);

const bricks = () => painted(128, 128, (ctx, w, h) => {
  ctx.fillStyle = "#9c8662";
  ctx.fillRect(0, 0, w, h);
  for (let row = 0, y = 0; y < h; row += 1, y += 16) {
    for (let x = row % 2 ? -16 : 0; x < w; x += 32) {
      const tone = 210 + Math.round(rand(-18, 18));
      ctx.fillStyle = `rgb(${tone + 30},${tone + 12},${tone - 30})`;
      ctx.fillRect(x + 1.5, y + 1.5, 29, 13);
    }
  }
}, { repeat: [2, 2] });

const planks = () => painted(128, 64, (ctx, w, h) => {
  ctx.fillStyle = "#6b3f20";
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 16) {
    const grad = ctx.createLinearGradient(0, y, 0, y + 16);
    grad.addColorStop(0, "#d79a62");
    grad.addColorStop(1, "#99602f");
    ctx.fillStyle = grad;
    ctx.fillRect(0, y + 1, w, 14);
    ctx.strokeStyle = "rgba(80,40,15,0.35)";
    for (let k = 0; k < 4; k += 1) {
      ctx.beginPath();
      ctx.moveTo(0, y + rand(3, 13));
      ctx.bezierCurveTo(w * 0.3, y + rand(2, 14), w * 0.6, y + rand(2, 14), w, y + rand(3, 13));
      ctx.stroke();
    }
  }
});

// A crenellated ring of merlons on top of a round tower.
function merlons(radius, y, count, size) {
  return Array.from({ length: count }, (_, k) => {
    const angle = (k / count) * Math.PI * 2, box = new THREE.BoxGeometry(size, size * 1.1, size * 0.7);
    box.rotateY(-angle);
    box.translate(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    return box;
  });
}

function windowShape(width, height) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(-width / 2, height - width / 2);
  shape.absarc(0, height - width / 2, width / 2, Math.PI, 0, true);
  shape.lineTo(width / 2, 0);
  return new THREE.ShapeGeometry(shape, 8);
}

function castle(world) {
  const group = new THREE.Group();
  const stone = standard({ map: bricks(), bumpMap: bricks(), bumpScale: 2, roughness: 0.92, color: "#fff4dc" });
  const plain = standard({ color: "#d8c59e", roughness: 0.9 });
  const parts = [
    [-0.72, 0, 0.36, 1.85], [0.72, 0, 0.36, 1.85], [0, -0.25, 0.27, 2.45],
  ].map(([x, z, r, h]) => {
    const tower = solid(new THREE.CylinderGeometry(r, r * 1.06, h, 24), stone);
    tower.position.set(x, h / 2, z);
    const rim = solid(merge([new THREE.CylinderGeometry(r * 1.12, r * 1.12, 0.1, 24), ...merlons(r * 1.05, 0.12, 8, r * 0.38)]), plain);
    rim.position.set(x, h + 0.02, z);
    group.add(tower, rim);
    return { x, z, r, h };
  });
  const wall = solid(new THREE.BoxGeometry(1.2, 1.05, 0.5), stone);
  wall.position.set(0, 0.52, 0.05);
  const battlement = solid(merge(Array.from({ length: 5 }, (_, k) => {
    const box = new THREE.BoxGeometry(0.15, 0.15, 0.5);
    box.translate(-0.48 + k * 0.24, 1.12, 0.05);
    return box;
  })), plain);
  group.add(wall, battlement);

  const glass = standard({ color: "#ffb54d", emissive: "#ff9a2e", emissiveIntensity: 1, roughness: 0.4 });
  const dark = standard({ color: "#2a1c10", roughness: 1 });
  const halos = [[parts[0], 1.05], [parts[1], 1.05], [parts[2], 1.75]].map(([{ x, z, r }, y]) => {
    const pane = new THREE.Mesh(windowShape(0.16, 0.26), glass);
    pane.position.set(x, y, z + r * 1.07);
    const glow = halo("#ffa040", 0.75);
    glow.position.set(x, y + 0.12, z + r * 1.07 + 0.05);
    group.add(pane, glow);
    return glow;
  });
  const door = new THREE.Mesh(windowShape(0.34, 0.5), dark);
  door.position.set(0, 0, 0.31);
  const arch = new THREE.Mesh(windowShape(0.44, 0.58), plain);
  arch.position.set(0, 0, 0.305);
  group.add(arch, door);

  const pole = solid(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6), standard({ color: "#6d5a44" }));
  pole.position.set(0, 2.72, -0.25);
  const cloth = new THREE.PlaneGeometry(0.38, 0.22, 10, 1);
  cloth.translate(0.19, 0, 0);
  const flag = solid(cloth, standard({ color: "#ff5d6c", side: THREE.DoubleSide, roughness: 0.8 }));
  flag.position.set(0.01, 2.85, -0.25);
  group.add(pole, flag);
  const glow = new THREE.PointLight("#ffb054", 0, 3.5, 1.4);
  glow.position.set(0, 1.2, 0.9);
  group.add(glow);

  group.position.set(2.3, floorAt(2.3, -1.3) - 0.1, -1.3);
  group.rotation.y = -0.22;
  world.add(group);
  const { position } = cloth.attributes;
  world.every((t) => {
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      position.setZ(i, Math.sin(x * 14 - t * 5) * 0.05 * x * 3);
    }
    position.needsUpdate = true;
    const flicker = 1 + Math.sin(t * 7) * 0.05 + Math.sin(t * 13) * 0.04;
    glass.emissiveIntensity = (0.15 + world.light.emit) * flicker;
    glow.intensity = world.light.emit * 3.5 * flicker;
    halos.forEach((light) => { light.material.opacity = Math.min(1, world.light.emit * 0.4) * flicker; });
  });
}

function chest(world, bubbles) {
  const group = new THREE.Group();
  const wood = standard({ map: planks(), bumpMap: planks(), roughness: 0.75 });
  const iron = standard({ color: "#8d939a", metalness: 0.85, roughness: 0.35 });
  const gold = standard({ color: "#ffc94a", metalness: 1, roughness: 0.25, emissive: "#6a4300", emissiveIntensity: 0.3 });
  const inside = standard({ color: "#3a2210", roughness: 0.9 });
  // An open box: a floor and four walls, so the hoard inside shows when the lid lifts.
  [[0.9, 0.04, 0.55, 0, 0.02, 0], [0.9, 0.42, 0.04, 0, 0.21, 0.255], [0.9, 0.42, 0.04, 0, 0.21, -0.255], [0.04, 0.42, 0.47, 0.43, 0.21, 0], [0.04, 0.42, 0.47, -0.43, 0.21, 0]]
    .forEach(([w, h, d, x, y, z]) => {
      const wall = solid(new THREE.BoxGeometry(w, h, d), wood);
      wall.position.set(x, y, z);
      group.add(wall);
    });
  const depth = solid(new THREE.BoxGeometry(0.82, 0.02, 0.47), inside);
  depth.position.y = 0.3;
  group.add(depth);
  [-0.3, 0.3].forEach((x) => [0.28, -0.28].forEach((z) => { // iron bands down the front and the back
    const band = solid(new THREE.BoxGeometry(0.07, 0.43, 0.012), iron);
    band.position.set(x, 0.21, z);
    group.add(band);
  }));
  const hoard = solid(merge([
    (() => { const g = new THREE.SphereGeometry(0.4, 20, 8, 0, Math.PI * 2, 0, 1.1); g.scale(1, 0.35, 0.6); return g; })(),
    ...Array.from({ length: 9 }, () => {
      const coin = new THREE.CylinderGeometry(0.06, 0.06, 0.015, 14);
      coin.rotateX(rand(-0.6, 0.6));
      coin.translate(rand(-0.3, 0.3), rand(0.02, 0.12), rand(-0.15, 0.15));
      return coin;
    }),
  ]), gold);
  hoard.position.y = 0.33;
  const gems = [["#ff4d6d", -0.15], ["#4dd2ff", 0.18]].map(([tone, x]) => {
    const gem = solid(new THREE.OctahedronGeometry(0.06), standard({ color: tone, emissive: tone, emissiveIntensity: 0.4, roughness: 0.1, metalness: 0.2 }));
    gem.position.set(x, 0.44, 0.02);
    return gem;
  });
  group.add(hoard, ...gems);
  const lock = solid(new THREE.BoxGeometry(0.13, 0.15, 0.03), gold);
  lock.position.set(0, 0.32, 0.29);
  group.add(lock);

  const hinge = new THREE.Group();
  hinge.position.set(0, 0.42, -0.275);
  const lidShape = new THREE.CylinderGeometry(0.275, 0.275, 0.9, 24, 1, false, 0, Math.PI);
  lidShape.rotateZ(Math.PI / 2); // the curved half on top, its axis along the chest
  const lid = solid(lidShape, wood);
  lid.position.z = 0.275;
  const lining = solid(lidShape, standard({ color: "#3a2210", roughness: 0.9, side: THREE.BackSide })); // the lid's inside
  lining.position.z = 0.275;
  const lidBands = [-0.3, 0.3].map((x) => {
    const g = new THREE.CylinderGeometry(0.28, 0.28, 0.07, 24, 1, false, 0, Math.PI);
    g.rotateZ(Math.PI / 2);
    const band = solid(g, iron);
    band.position.set(x, 0, 0.275);
    return band;
  });
  hinge.add(lid, lining, ...lidBands);
  group.add(hinge);

  const x = -3.5, z = 0.75;
  group.position.set(x, floorAt(x, z) - 0.05, z);
  group.rotation.y = 0.35;
  world.add(group);
  let opened = false;
  world.every((t) => {
    const phase = (t % 7) / 7; // closed most of the time, opens, waits, closes
    const open = phase < 0.6 ? 0 : phase < 0.68 ? (phase - 0.6) / 0.08 : phase < 0.88 ? 1 : phase < 0.94 ? 1 - (phase - 0.88) / 0.06 : 0;
    hinge.rotation.x = -0.75 * open * open * (3 - 2 * open);
    gems.forEach((gem, k) => { gem.rotation.y = t * 1.5 + k; });
    if (open > 0.5 && !opened) bubbles.burst(group.localToWorld(V(0, 0.5, 0)), 5);
    opened = open > 0.5;
  });
}

function coral(world) {
  const parts = [];
  const grow = (from, dir, length, radius, depth) => {
    const to = from.clone().addScaledVector(dir, length);
    const bend = from.clone().lerp(to, 0.5).add(V(rand(-0.08, 0.08), 0.05, rand(-0.08, 0.08)));
    parts.push(tube(curve(from, bend, to, 8), (s) => radius * (1 - s * 0.3), 8));
    if (depth === 0) {
      const tip = new THREE.IcosahedronGeometry(radius * 1.4, 1);
      tip.translate(to.x, to.y, to.z);
      parts.push(tip);
      return;
    }
    const forks = depth === 3 ? 3 : 2;
    for (let k = 0; k < forks; k += 1) {
      const angle = (k / forks) * Math.PI * 2 + rand(-0.5, 0.5) + depth;
      const spread = V(Math.cos(angle), rand(0.55, 1), Math.sin(angle) * 0.6).normalize();
      grow(to, dir.clone().lerp(spread, 0.7).normalize(), length * rand(0.75, 0.95), radius * 0.74, depth - 1);
    }
  };
  grow(V(0, -0.1, 0), V(0, 1, 0), 0.5, 0.15, 3);
  const geometry = paint(merge(parts), (x, y) => mix(color("#c2305e"), color("#ffb3cb"), y / 1.5));
  const mesh = solid(geometry, standard({ vertexColors: true, roughness: 0.75 }));
  mesh.position.set(-1.05, floorAt(-1.05, -0.7), -0.7);
  world.add(mesh);
}

function seaFan(world) {
  const parts = [];
  for (let k = 0; k < 9; k += 1) {
    const angle = -1.1 + (k / 8) * 2.2, reach = rand(1.1, 1.5);
    const tip = V(Math.sin(angle) * reach * 0.75, Math.cos(angle) * reach * 0.9 + 0.2, rand(-0.06, 0.06));
    parts.push(tube(curve(V(0, 0, 0), V(tip.x * 0.3, tip.y * 0.6, 0), tip, 12), (s) => 0.035 * (1 - s * 0.6), 5));
  }
  for (let ring = 1; ring <= 5; ring += 1) { // the mesh between the branches
    const r = ring * 0.22;
    const arc = Array.from({ length: 16 }, (_, k) => {
      const angle = -1.05 + (k / 15) * 2.1;
      return V(Math.sin(angle) * r * 0.75 * 1.05, Math.cos(angle) * r * 0.9 + 0.2, Math.sin(k * 1.7) * 0.03);
    });
    parts.push(tube(arc, () => 0.012, 4));
  }
  const geometry = swayByHeight(paint(merge(parts), (x, y) => mix(color("#7c3fa8"), color("#d68cff"), y / 1.4)), 0, 1.5);
  const mesh = swaying(solid(geometry, leafy({ roughness: 0.7 })), 0.1);
  mesh.position.set(-2.15, floorAt(-2.15, -1.8) - 0.05, -1.8);
  mesh.rotation.y = 0.25;
  world.add(mesh);
}

function anemone(world) {
  const parts = [tube(curve(V(0, -0.1, 0), V(0, 0.15, 0), V(0, 0.32, 0), 6), (s) => 0.2 + s * 0.06, 16)];
  for (let k = 0; k < 26; k += 1) {
    const angle = k * 2.4, ring = 0.08 + (k % 3) * 0.06, out = V(Math.cos(angle), 0, Math.sin(angle));
    const base = out.clone().multiplyScalar(ring).setY(0.32), length = rand(0.35, 0.55);
    const tip = base.clone().addScaledVector(out, length * 0.6).setY(0.32 + length);
    parts.push(tube(curve(base, base.clone().addScaledVector(out, 0.05).setY(0.32 + length * 0.6), tip, 8), (s) => 0.035 * (1 - s * 0.45), 6));
    const bulb = new THREE.IcosahedronGeometry(0.03, 1);
    bulb.translate(tip.x, tip.y, tip.z);
    parts.push(paint(bulb, color("#ffe0e7")));
  }
  const geometry = merge(parts.map((part) => (part.attributes.color ? part : paint(part, (x, y) => mix(color("#c4576b"), color("#ff9cb0"), (y - 0.2) * 2)))));
  const mesh = swaying(solid(swayByHeight(geometry, 0.32, 0.85), leafy({ roughness: 0.5 })), 0.16);
  mesh.position.set(-0.15, floorAt(-0.15, 0.9) - 0.06, 0.9);
  world.add(mesh);
  return mesh;
}

function starfish(world) {
  const shape = new THREE.Shape();
  for (let k = 0; k <= 10; k += 1) {
    const angle = (k / 10) * Math.PI * 2 + Math.PI / 2, r = k % 2 ? 0.1 : 0.3;
    if (k === 0) shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
    else shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.05, bevelSegments: 4 });
  geometry.rotateX(-Math.PI / 2);
  const bumps = Array.from({ length: 25 }, (_, k) => {
    const arm = (k % 5) * ((Math.PI * 2) / 5) + Math.PI / 2, along = 0.06 + Math.floor(k / 5) * 0.045;
    const bump = new THREE.IcosahedronGeometry(0.018, 0);
    bump.translate(Math.cos(arm) * along, 0.08, -Math.sin(arm) * along);
    return paint(bump, color("#fff1dc"));
  });
  const star = solid(merge([paint(geometry, (x, y, z) => mix(color("#d96b33"), color("#ffab5e"), 1 - Math.hypot(x, z) * 2)), ...bumps]), standard({ vertexColors: true, roughness: 0.6 }));
  const x = 1.6, z = 1.55;
  star.position.set(x, floorAt(x, z) + 0.02, z);
  world.add(star);
  world.every((t) => { star.rotation.y = t * 0.15; });
}

// Bubbles: a pool of glassy spheres that rise, wobble and grow a little, from the airstone and the chest.
function bubblePool(world, count = 40) {
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    vertexShader: `varying vec3 vNormal; varying vec3 vView;
      void main() { vec4 at = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal); vView = normalize(-at.xyz); gl_Position = projectionMatrix * at; }`,
    fragmentShader: `varying vec3 vNormal; varying vec3 vView;
      void main() { float rim = pow(1.0 - abs(dot(vNormal, vView)), 2.2);
        float spot = smoothstep(0.82, 0.95, dot(vNormal, normalize(vec3(-0.4, 0.6, 0.7))));
        gl_FragColor = vec4(vec3(1.0), clamp(0.08 + rim * 0.75 + spot, 0.0, 1.0)); }`,
  });
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), material, count);
  mesh.frustumCulled = false;
  const items = Array.from({ length: count }, () => ({ alive: false, at: V(0, -10, 0), size: 0, speed: 0, seed: 0 }));
  const place = new THREE.Object3D();
  let next = 0;
  const spawn = (from, size) => {
    const item = items[next];
    next = (next + 1) % count;
    Object.assign(item, { alive: true, size, speed: rand(0.9, 1.3), seed: rand(0, 9) });
    item.at.copy(from).add(V(rand(-0.04, 0.04), 0, rand(-0.04, 0.04)));
  };
  world.add(mesh);
  world.every((t, dt) => {
    items.forEach((item, i) => {
      if (item.alive) {
        item.at.y += item.speed * dt;
        item.at.x += Math.sin(t * 5 + item.seed) * 0.12 * dt;
        item.size *= 1 + dt * 0.08;
        if (item.at.y > SURFACE - 0.05) item.alive = false;
      }
      place.position.copy(item.at);
      place.scale.setScalar(item.alive ? item.size : 0);
      place.updateMatrix();
      mesh.setMatrixAt(i, place.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return { spawn, burst: (from, n) => { for (let k = 0; k < n; k += 1) spawn(from.clone().add(V(rand(-0.1, 0.1), k * 0.06, 0)), rand(0.035, 0.07)); } };
}

function airstone(world, bubbles) {
  const { x, z } = AIRSTONE;
  const stone = solid(paint(new THREE.SphereGeometry(0.16, 16, 10), (px, py) => mix(color("#5a626b"), color("#c3cad2"), py * 3 + 0.5)), standard({ vertexColors: true, roughness: 0.9 }));
  stone.scale.set(1.2, 0.45, 1);
  stone.position.set(x, floorAt(x, z) + 0.04, z);
  world.add(stone);
  let wait = 0;
  world.every((t, dt) => {
    wait -= dt;
    if (wait > 0) return;
    wait = rand(0.18, 0.4);
    bubbles.spawn(V(x + rand(-0.06, 0.06), stone.position.y + 0.08, z), rand(0.03, 0.075));
  });
}

export function placeDecor(world) {
  const bubbles = bubblePool(world);
  castle(world);
  chest(world, bubbles);
  coral(world);
  seaFan(world);
  starfish(world);
  airstone(world, bubbles);
  return { anemone: anemone(world) };
}

