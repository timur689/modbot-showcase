// The cat's costumes in 3D, one per theme and a few more to pick by hand. Each is built in the coordinates of the
// part it is worn on (the head, or the torso for the scarf) and follows that part in every move. Things on the face
// are laid along the face itself (faceZ), things on top sit on the dome, and the ears poke through the hats.
import * as THREE from "./vendor/three.module.min.js";
import { BODY_FORM, HEAD_FORM as H } from "./cat_body.js";

const NECK = 0.48; // where the head meets the body, in torso coordinates

const matte = (color, roughness = 0.85) => new THREE.MeshStandardMaterial({ color, roughness });
// Metal, but not mirror-like: with nothing around to reflect, a true metal would render nearly black.
const shiny = (color, glow = 0x000000) => new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.35, emissive: glow });
const glowing = (color, intensity = 1.4) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.4 });
const glass = (color, opacity) => new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.05, metalness: 0.1, depthWrite: false });

function mesh(geometry, material, x = 0, y = 0, z = 0) {
  const node = new THREE.Mesh(geometry, material);
  node.position.set(x, y, z);
  node.castShadow = !material.transparent;
  return node;
}

const ball = (r, material, x, y, z, sx = 1, sy = 1, sz = 1) => {
  const node = mesh(new THREE.SphereGeometry(r, 32, 24), material, x, y, z);
  node.scale.set(sx, sy, sz);
  return node;
};

const ring = (radius, tube, material, x = 0, y = 0, z = 0) => mesh(new THREE.TorusGeometry(radius, tube, 14, 64), material, x, y, z);

// A point on the face, a little in front of it, and how far the face is turned there.
const onFace = (x, y, lift) => new THREE.Vector3(x, y, H.faceZ(x, y) + lift);
const turnAt = (x, y) => Math.asin(Math.max(-1, Math.min(1, x / Math.max(0.01, H.headRadius(y)))));

// A soft line along the face, through (x, y) points.
function faceLine(points, lift, radius, material, closed = false) {
  const path = new THREE.CatmullRomCurve3(points.map(([x, y]) => onFace(x, y, lift)), closed);
  return mesh(new THREE.TubeGeometry(path, 96, radius, 10, closed), material);
}

// A thin curved sheet laid over the face, e.g. the glass of a mask or a visor.
function facePatch(x0, x1, y0, y1, lift, material, columns = 32, rows = 8) {
  const positions = [], indices = [];
  for (let j = 0; j <= rows; j += 1) {
    for (let i = 0; i <= columns; i += 1) {
      const x = x0 + ((x1 - x0) * i) / columns, y = y0 + ((y1 - y0) * j) / rows;
      positions.push(x, y, H.faceZ(x, y) + lift);
    }
  }
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < columns; i += 1) {
      const a = j * (columns + 1) + i, b = a + columns + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return mesh(geometry, material);
}

// Something sitting on the head, turned to face out of the surface at (x, y).
function onHead(node, x, y, lift = 0.02) {
  const at = onFace(x, y, lift);
  node.position.copy(at);
  node.lookAt(at.clone().add(new THREE.Vector3(x, (y - H.y) * 1.4, at.z).normalize()));
  return node;
}

// Stripes painted along a geometry: every vertex takes one of the colours by `band(x, y, z)`.
function stripes(geometry, colors, band) {
  const position = geometry.attributes.position, paint = [];
  for (let i = 0; i < position.count; i += 1) {
    const color = new THREE.Color(colors[band(position.getX(i), position.getY(i), position.getZ(i)) % colors.length]);
    paint.push(color.r, color.g, color.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(paint, 3));
  return geometry;
}
const painted = (roughness = 0.9) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness });

// ---- the costumes ----

function shades() { // neon: glowing pink glasses with dark lenses
  const group = new THREE.Group(), frame = glowing(0xff3fb4), lens = glass(0x12061f, 0.82);
  for (const side of [-1, 1]) {
    const x = side * 0.36, y = 0.5, eye = new THREE.Group();
    eye.position.copy(onFace(x, y, 0.08));
    eye.rotation.y = turnAt(x, y);
    const disc = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.01, 40), lens);
    disc.rotation.x = Math.PI / 2;
    disc.scale.set(1.15, 1, 0.85);
    const rim = ring(0.15, 0.018, frame);
    rim.scale.set(1.15, 0.85, 1);
    eye.add(disc, rim);
    group.add(eye);
  }
  group.add(faceLine([[-0.19, 0.52], [0, 0.56], [0.19, 0.52]], 0.08, 0.016, frame));
  return group;
}

function flower(radius, petalColor) {
  const node = new THREE.Group(), petal = matte(petalColor, 0.6);
  for (let k = 0; k < 5; k += 1) {
    const a = (k / 5) * Math.PI * 2;
    const leaf = ball(radius * 0.55, petal, Math.cos(a) * radius * 0.6, Math.sin(a) * radius * 0.6, 0, 1, 0.62, 0.28);
    leaf.rotation.z = a;
    node.add(leaf);
  }
  node.add(ball(radius * 0.28, matte(0xffd36a, 0.5), 0, 0, radius * 0.08));
  return node;
}

function sakura() { // sakura: a cluster of blossoms by the left ear
  const group = new THREE.Group();
  [[-0.5, 1.12, 0.17, 0xffb7cf], [-0.3, 1.24, 0.13, 0xffd0de], [-0.64, 0.95, 0.12, 0xff9fbe]]
    .forEach(([x, y, r, color]) => group.add(onHead(flower(r, color), x, y, 0.03)));
  return { head: group };
}

function scarf() { // aurora: a striped knitted scarf where the head meets the body, one end hanging down
  const group = new THREE.Group(), colors = [0x2bd9a0, 0x7c5cff];
  const wrap = mesh(stripes(new THREE.TorusGeometry(0.39, 0.085, 16, 80), colors, (x, y) => Math.floor(((Math.atan2(y, x) + Math.PI) / (Math.PI * 2)) * 18)), painted());
  wrap.rotation.x = Math.PI / 2;
  wrap.scale.set(1, 0.88, 1);
  wrap.position.y = NECK - 0.02;
  const end = mesh(stripes(new THREE.BoxGeometry(0.17, 0.4, 0.05, 1, 10, 1), colors, (x, y) => Math.floor((y + 0.2) * 22)), painted());
  end.position.set(0.17, NECK - 0.2, 0.32);
  end.rotation.set(0.25, 0, 0.18);
  for (let k = 0; k < 4; k += 1) { // the fringe
    const thread = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 6), matte(colors[k % 2]));
    thread.position.set(-0.06 + k * 0.04, -0.23, 0);
    end.add(thread);
  }
  group.add(wrap, end);
  return { torso: group };
}

function snorkel() { // ocean: a diving mask over both eyes, its strap round the head, and a snorkel up the side
  const group = new THREE.Group(), rubber = matte(0x17324d, 0.6), tube = matte(0xff8a2b, 0.5);
  const strap = ring(H.headRadius(0.52) + 0.012, 0.03, rubber, 0, 0.52, 0);
  strap.rotation.x = Math.PI / 2;
  strap.scale.set(1, H.rz / H.rx, 1);
  const outline = [[-0.46, 0.5], [-0.42, 0.64], [0, 0.67], [0.42, 0.64], [0.46, 0.5], [0.42, 0.37], [0.12, 0.35], [0, 0.42], [-0.12, 0.35], [-0.42, 0.37]];
  group.add(strap, faceLine(outline, 0.06, 0.035, rubber, true), facePatch(-0.44, 0.44, 0.38, 0.65, 0.055, glass(0x9fe8ff, 0.32)));
  const path = new THREE.CatmullRomCurve3([[-0.44, 0.56, H.faceZ(-0.44, 0.56) + 0.07], [-0.84, 0.62, 0.3], [-0.97, 1.0, 0.15], [-0.9, 1.42, 0.08]]
    .map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  group.add(mesh(new THREE.TubeGeometry(path, 64, 0.035, 12), tube), ball(0.05, tube, ...path.getPoint(1).toArray()));
  return { head: group };
}

function astronaut() { // cosmos: a glass helmet over the head and ears, on a collar, with a glowing antenna
  const group = new THREE.Group(), cut = 2.45, radius = 1.08, center = 0.7; // the cut sits below the head, on the shoulders
  const bubble = mesh(new THREE.SphereGeometry(radius, 64, 40, 0, Math.PI * 2, 0, cut), glass(0xd8ecff, 0.16));
  bubble.position.y = center;
  bubble.renderOrder = 2;
  const shine = ball(0.16, glass(0xffffff, 0.5), -0.55, center + 0.62, 0.62, 1.6, 0.55, 0.3);
  shine.rotation.z = 0.7;
  const rim = radius * Math.sin(cut), rimY = center + radius * Math.cos(cut);
  const collar = ring(rim, 0.075, shiny(0xd9dce6, 0x1a1c22), 0, rimY, 0);
  collar.rotation.x = Math.PI / 2;
  const band = ring(rim + 0.005, 0.02, glowing(0x9d7bff, 1.2), 0, rimY + 0.05, 0);
  band.rotation.x = Math.PI / 2;
  const mast = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 8), shiny(0xd9dce6), 0.55, rimY + 0.2, -0.35);
  group.add(bubble, shine, collar, band, mast, ball(0.045, glowing(0x9d7bff, 2), 0.55, rimY + 0.38, -0.35));
  return { head: group };
}

function roundGlasses(color, lens) {
  const group = new THREE.Group(), frame = shiny(color);
  for (const side of [-1, 1]) {
    const x = side * 0.36, y = 0.5, eye = new THREE.Group();
    eye.position.copy(onFace(x, y, 0.06));
    eye.rotation.y = turnAt(x, y);
    eye.add(ring(0.12, 0.013, frame));
    if (lens) {
      const disc = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.004, 32), lens);
      disc.rotation.x = Math.PI / 2;
      eye.add(disc);
    }
    group.add(eye);
  }
  group.add(faceLine([[-0.24, 0.52], [0, 0.55], [0.24, 0.52]], 0.06, 0.012, frame));
  return group;
}

function beret() { // retro: a red beret tipped to one side and round tortoiseshell glasses
  const group = new THREE.Group(), felt = matte(0xb8322a, 0.95);
  const cap = ball(0.55, felt, -0.12, H.y + H.ry - 0.03, 0.02, 1, 0.28, 0.95);
  cap.rotation.z = 0.22;
  const stalk = mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.07, 10), felt, -0.08, H.y + H.ry + 0.13, 0.02);
  stalk.rotation.z = 0.22;
  group.add(cap, stalk, roundGlasses(0x6b4a2b, glass(0xfff2d8, 0.12)));
  return { head: group };
}

function strawHat() { // sunset: a straw hat tipped back, with a pink ribbon; the ears come through the brim
  const group = new THREE.Group(), straw = matte(0xe9c67b, 1);
  group.position.set(0, H.y + H.ry - 0.06, -0.04);
  group.rotation.x = -0.14;
  group.add(mesh(new THREE.CylinderGeometry(0.66, 0.68, 0.03, 72), straw));
  group.add(mesh(new THREE.CylinderGeometry(0.34, 0.39, 0.22, 48), straw, 0, 0.12, 0));
  group.add(ball(0.34, straw, 0, 0.23, 0, 1, 0.32, 1));
  group.add(mesh(new THREE.CylinderGeometry(0.392, 0.396, 0.06, 48), matte(0xe8507a, 0.6), 0, 0.05, 0));
  return { head: group };
}

function beanie() { // winter: a red knitted hat with a white cuff and pompom; the ears come through it
  const group = new THREE.Group(), reach = 1.0, sx = H.rx + 0.035, sy = H.ry + 0.03, sz = H.rz + 0.035;
  const dome = new THREE.SphereGeometry(1, 72, 24, 0, Math.PI * 2, 0, reach);
  const position = dome.attributes.position;
  for (let i = 0; i < position.count; i += 1) { // knitted ribs
    const x = position.getX(i), z = position.getZ(i), push = 1 + 0.025 * Math.abs(Math.cos(Math.atan2(z, x) * 24));
    position.setX(i, x * push);
    position.setZ(i, z * push);
  }
  dome.computeVertexNormals();
  const cap = mesh(dome, matte(0xd64545, 0.95), 0, H.y, 0);
  cap.scale.set(sx, sy, sz);
  const cuff = ring(Math.sin(reach), 0.06, matte(0xf4f1ea, 0.95), 0, H.y + sy * Math.cos(reach), 0);
  cuff.rotation.x = Math.PI / 2;
  cuff.scale.set(sx, sz, 1);
  const fluff = new THREE.IcosahedronGeometry(0.15, 3), fp = fluff.attributes.position;
  for (let i = 0; i < fp.count; i += 1) {
    const x = fp.getX(i), y = fp.getY(i), z = fp.getZ(i), push = 1 + (Math.abs(Math.sin(x * 412 + y * 731 + z * 197) * 43758) % 1 - 0.5) * 0.25;
    fp.setXYZ(i, x * push, y * push, z * push);
  }
  fluff.computeVertexNormals();
  group.add(cap, cuff, mesh(fluff, matte(0xf4f1ea, 1), 0, H.y + sy + 0.1, 0));
  return { head: group };
}

function visor() { // cyber: a glowing see-through visor across the eyes, with bright edges and a little light
  const group = new THREE.Group(), edge = glowing(0x00f0ff, 1.8);
  const pane = facePatch(-0.62, 0.62, 0.42, 0.6, 0.06, new THREE.MeshStandardMaterial({
    color: 0x00e5ff, emissive: 0x00a8c0, emissiveIntensity: 0.6, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide,
  }));
  const along = (y) => Array.from({ length: 9 }, (_, i) => [-0.62 + i * 0.155, y]);
  group.add(pane, faceLine(along(0.6), 0.06, 0.012, edge), faceLine(along(0.42), 0.06, 0.012, edge));
  group.add(ball(0.035, glowing(0xfcee0a, 2), ...onFace(0.66, 0.51, 0.05).toArray()));
  return { head: group };
}

function crown() { // a little golden crown with five points and two jewels
  const group = new THREE.Group();
  const band = new THREE.CylinderGeometry(0.3, 0.27, 0.2, 60, 4, true), position = band.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i);
    if (y > 0.05) position.setY(i, y + 0.12 * Math.pow((1 + Math.cos(Math.atan2(position.getZ(i), position.getX(i)) * 5)) / 2, 2));
  }
  band.computeVertexNormals();
  const gold = new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: 0.3, metalness: 0.35, emissive: 0x3a2800, side: THREE.DoubleSide });
  const top = mesh(band, gold, 0, H.y + H.ry + 0.02, 0);
  top.rotation.z = 0.08;
  group.add(top, ball(0.035, shiny(0xe0245e), 0, H.y + H.ry + 0.02, 0.29), ball(0.03, shiny(0x2f6fe0), 0.2, H.y + H.ry + 0.02, 0.21));
  return { head: group };
}

function bow() { // a pink bow by the left ear
  const node = new THREE.Group(), satin = matte(0xff6fa5, 0.45);
  for (const side of [-1, 1]) {
    const lobe = ball(0.12, satin, side * 0.13, 0, 0, 1.3, 0.8, 0.45);
    lobe.rotation.z = side * -0.3;
    node.add(lobe);
  }
  node.add(ball(0.055, satin, 0, 0, 0.03));
  return { head: onHead(node, -0.38, 1.17, 0.04) };
}

function partyHat() { // a striped party cone with a pompom, tipped to one side
  const cone = mesh(stripes(new THREE.ConeGeometry(0.22, 0.52, 48, 12), [0x2f6fe0, 0xffd36a, 0xff6fa5],
    (x, y, z) => Math.floor((y + 0.26) * 10 + Math.atan2(z, x) * 0.8)), painted(0.7));
  const group = new THREE.Group();
  group.position.set(0.12, H.y + H.ry + 0.2, 0.04);
  group.rotation.z = -0.25;
  group.add(cone, ball(0.07, matte(0xffffff, 1), 0, 0.29, 0));
  return { head: group };
}

// ---- the costumes the cat earns as it grows (progress.py) ----

function ninja() { // level 2: a red headband with a metal plate, tied at the back with two loose ends
  const group = new THREE.Group(), cloth = matte(0xc0392b, 0.8), y = 0.86;
  const band = ring(H.headRadius(y) + 0.012, 0.045, cloth, 0, y, 0);
  band.rotation.x = Math.PI / 2;
  band.scale.set(1, H.rz / H.rx, 1.4);
  const plate = mesh(new THREE.BoxGeometry(0.26, 0.12, 0.025), shiny(0xc7ccd6, 0x15171c));
  plate.position.copy(onFace(0, y, 0.05));
  plate.add(mesh(new THREE.BoxGeometry(0.16, 0.012, 0.01), matte(0x4a4f5a), 0, 0, 0.014));
  group.add(band, plate);
  for (const [x, angle] of [[0.12, 0.5], [0.2, 0.9]]) {
    const tail = mesh(new THREE.BoxGeometry(0.07, 0.34, 0.02), cloth, x, y - 0.17, -H.rz - 0.02);
    tail.rotation.z = angle * 0.4;
    group.add(tail);
  }
  return { head: group };
}

function pirate() { // level 3: a black tricorn with a gold trim and a little skull
  const group = new THREE.Group(), felt = matte(0x1f1d22, 0.9);
  group.position.set(0, H.y + H.ry - 0.06, 0);
  group.rotation.x = -0.1;
  group.add(mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.26, 48), felt, 0, 0.11, 0), ball(0.34, felt, 0, 0.24, 0, 1, 0.3, 1));
  const brim = ring(0.52, 0.08, felt, 0, 0.03, 0);
  brim.rotation.x = Math.PI / 2;
  brim.scale.set(1, 1, 1.8); // the brim turned up all round
  const trim = ring(0.52, 0.016, shiny(0xe0b14a, 0x2a1d00), 0, 0.17, 0);
  trim.rotation.x = Math.PI / 2;
  const skull = ball(0.055, matte(0xf4f1ea, 0.6), 0, 0.13, 0.4);
  for (const side of [-1, 1]) skull.add(ball(0.013, matte(0x1f1d22), side * 0.02, 0.008, 0.05));
  group.add(brim, trim, skull);
  return { head: group };
}

function halo() { // level 4: a glowing golden halo floating over the ears
  const glow = ring(0.36, 0.035, glowing(0xffe27a, 1.6), 0, H.y + H.ry + 0.32, -0.04);
  glow.rotation.x = Math.PI / 2 - 0.3;
  glow.castShadow = false;
  return { head: glow };
}

function wings() { // level 5: two small feathered wings on the back
  const group = new THREE.Group(), feather = new THREE.MeshStandardMaterial({ color: 0xf6f8ff, roughness: 0.6, emissive: 0x1a2236 });
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    wing.position.set(side * 0.22, 0.42, -0.26);
    wing.rotation.set(0.15, side * 0.35, side * -0.45); // spread out to the sides, so they show from the front
    [[0.42, 0.13, 0], [0.35, 0.11, -0.35], [0.28, 0.1, -0.7]].forEach(([length, width, tilt], k) => {
      const plume = ball(length, feather, side * (0.24 + k * 0.03), 0.06 - k * 0.1, 0, 1, width / length, 0.18);
      plume.rotation.z = side * tilt;
      wing.add(plume);
    });
    group.add(wing);
  }
  return { torso: group };
}

// ---- the spider costume: an original suit, not any film's ----

// Silver web strands on dark cloth, drawn for a surface of revolution: threads run from the crown down (columns)
// and sagging cross-strands join them (rows), so on the head the web spreads out from the top.
function webCloth() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const paint = canvas.getContext("2d"), columns = 18, rows = 9, w = canvas.width, h = canvas.height;
  paint.fillStyle = "#1d2350";
  paint.fillRect(0, 0, w, h);
  paint.strokeStyle = "rgba(205, 214, 235, 0.9)";
  paint.lineWidth = 3;
  for (let i = 0; i <= columns; i += 1) {
    paint.beginPath();
    paint.moveTo((i / columns) * w, 0);
    paint.lineTo((i / columns) * w, h);
    paint.stroke();
  }
  for (let j = 1; j <= rows; j += 1) {
    const y = (j / (rows + 1)) * h;
    paint.beginPath();
    for (let i = 0; i < columns; i += 1) {
      const x0 = (i / columns) * w, x1 = ((i + 1) / columns) * w;
      paint.moveTo(x0, y);
      paint.quadraticCurveTo((x0 + x1) / 2, y + h / (rows * 3), x1, y); // each strand sags a little
    }
    paint.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.55 });
}

// A shell just outside an outline (radius, height), bottom to top, smoothed like the cat's own body.
function shell(outline, grow, material, depth) {
  const smooth = new THREE.SplineCurve(outline.map(([r, y]) => new THREE.Vector2(Math.max(0.001, r * grow), y))).getPoints(72);
  const node = mesh(new THREE.LatheGeometry(smooth, 96), material);
  node.scale.z = depth;
  return node;
}

function spiderLens(side) {
  const x = side * 0.36, y = 0.52, lens = new THREE.Group();
  lens.position.copy(onFace(x, y, 0.03));
  lens.rotation.set(0.04, turnAt(x, y), side * 0.35); // slanted, the way a spider suit's eyes are
  const white = ball(0.12, glowing(0xe8f6ff, 0.5), 0, 0, 0, 1.25, 0.9, 0.3);
  const rim = ring(0.12, 0.016, matte(0x0b0e22, 0.5));
  rim.scale.set(1.25, 0.9, 1);
  lens.add(white, rim);
  return lens;
}

function spiderEmblem() {
  const node = new THREE.Group(), black = matte(0x0b0e22, 0.4);
  node.add(ball(0.035, black, 0, 0.03, 0, 1, 1.1, 0.6), ball(0.05, black, 0, -0.04, 0, 0.9, 1.3, 0.6));
  for (const side of [-1, 1]) {
    for (let k = 0; k < 4; k += 1) {
      const leg = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.11, 6), black, side * 0.05, 0.03 - k * 0.025, 0);
      leg.rotation.z = side * (1.1 - k * 0.45);
      node.add(leg);
    }
  }
  return node;
}

function spider() { // a dark suit with silver webs, big white lenses and a little spider on the chest
  const cloth = webCloth(), bottom = H.y - H.ry, steps = 72;
  const outline = Array.from({ length: steps + 1 }, (_, i) => {
    const y = bottom + ((H.y + H.ry - bottom) * i) / steps;
    return [H.headRadius(y), y];
  });
  const head = new THREE.Group();
  head.add(shell([[0.001, bottom], ...outline], 1.012, cloth, H.rz / H.rx), spiderLens(-1), spiderLens(1));
  const torso = new THREE.Group();
  torso.add(shell(BODY_FORM.outline, 1.015, cloth, BODY_FORM.depth));
  const emblem = spiderEmblem();
  emblem.position.set(0, 0.33, 0.4 * BODY_FORM.depth + 0.02);
  torso.add(emblem);
  return { head, torso };
}

// ---- seasonal costumes: won on the wheel only during their event (space/events.py), kept for good ----

function witch() { // Halloween: a wide-brimmed witch's hat, its tip bent over, with an orange band and a buckle
  const group = new THREE.Group(), felt = matte(0x3b2153, 0.85);
  group.position.set(0.02, H.y + H.ry + 0.03, -0.02); // on top of the head, its brim clear of it
  group.rotation.set(-0.08, 0, -0.1);
  group.scale.setScalar(1.12);
  const brim = mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.035, 64), felt, 0, 0.02, 0);
  const crown = mesh(new THREE.CylinderGeometry(0.17, 0.33, 0.42, 48), felt, 0, 0.24, 0);
  const tip = mesh(new THREE.ConeGeometry(0.17, 0.36, 40), felt);
  tip.position.set(0.06, 0.52, -0.02);
  tip.rotation.z = -0.55; // bent over, as witches' hats are
  const band = mesh(new THREE.CylinderGeometry(0.315, 0.33, 0.07, 48, 1, true), matte(0xff8a1f, 0.7), 0, 0.08, 0);
  const buckle = mesh(new THREE.BoxGeometry(0.11, 0.09, 0.02), shiny(0xe0b14a, 0x2a1d00), 0, 0.08, 0.33);
  buckle.add(mesh(new THREE.BoxGeometry(0.06, 0.045, 0.012), matte(0x3b2153), 0, 0, 0.008));
  group.add(brim, crown, tip, band, buckle);
  return { head: group };
}

function santa() { // New year: a red Santa's cap with white fur, its tip hanging to one side with a pompom
  const group = new THREE.Group(), red = matte(0xd92b2b, 0.75), fur = matte(0xfafafa, 1);
  group.position.set(0.04, H.y + H.ry - 0.14, 0); // pulled down over the top of the head
  group.rotation.set(-0.12, 0, -0.18);
  group.scale.setScalar(1.55);
  const cap = mesh(new THREE.CylinderGeometry(0.2, 0.42, 0.34, 48), red, 0, 0.17, 0);
  const tip = mesh(new THREE.ConeGeometry(0.2, 0.38, 40), red);
  tip.position.set(0.16, 0.36, 0);
  tip.rotation.z = -1.05; // the soft tip falls over
  const trim = ring(0.43, 0.075, fur, 0, 0.02, 0);
  trim.rotation.x = Math.PI / 2;
  group.add(cap, tip, trim, ball(0.085, fur, 0.36, 0.3, 0));
  return { head: group };
}

function wreath() { // Spring: a wreath of leaves round the top of the head, with little flowers in it
  const group = new THREE.Group(), y = H.y + H.ry * 0.84, radius = H.headRadius(y) + 0.03; // just outside the head
  const leaves = ring(radius, 0.065, matte(0x4f9a4a, 0.8), 0, y, 0);
  leaves.rotation.x = Math.PI / 2;
  leaves.scale.set(1, H.rz / H.rx, 1);
  group.add(leaves);
  const colors = [0xff8fb8, 0xffe27a, 0xffffff, 0xc49bff];
  for (let k = 0; k < 10; k += 1) {
    const a = (k / 10) * Math.PI * 2;
    const bloom = flower(0.1, colors[k % colors.length]);
    bloom.position.set(Math.cos(a) * radius, y + 0.05, Math.sin(a) * radius * (H.rz / H.rx));
    bloom.lookAt(bloom.position.clone().multiplyScalar(2).setY(y + 0.6));
    group.add(bloom);
  }
  group.rotation.x = 0.32; // tipped towards whoever looks, so the flowers show
  group.position.set(0, -0.1, 0.08);
  return { head: group };
}

const BUILDERS = { none: () => ({}), shades: () => ({ head: shades() }), sakura, scarf, snorkel, astronaut, beret, strawhat: strawHat, beanie, visor, crown, bow, party: partyHat, ninja, pirate, halo, wings, spider, witch, santa, wreath };

// Puts the costume on the figure; returns a way to take it off again.
export function dressUp(figure, id) {
  const parts = (BUILDERS[id] || BUILDERS.none)();
  const worn = [];
  if (parts.head) { figure.head.add(parts.head); worn.push(parts.head); }
  if (parts.torso) { figure.torso.add(parts.torso); worn.push(parts.torso); }
  return () => worn.forEach((node) => node.removeFromParent());
}
