// The guide's body, modelled on the owner's reference: a soft white toy cat with a huge round head, big pointed
// ears, two shiny black bead eyes set wide and low, a tiny "w" mouth, a small pear-shaped body with stubby arms,
// two round feet and a tail curling up behind. Units: the ground is y = 0, the cat is about 2.3 tall; every part
// that moves sits on its own pivot, and dress() adds the motion of the soft parts (tail, ears, belly).
import * as THREE from "./vendor/three.module.min.js";

const HIP_Y = 0.28; // where the feet hinge; the torso (body, head, arms, tail) pivots here too
const NECK_Y = 0.76; // no neck: the head sits right down on the body and flows into it
const HEAD = { y: 0.65, rx: 0.88, ry: 0.68, rz: 0.77 }; // a wide, slightly squashed ball, much bigger than the body

const M = {
  fur: new THREE.MeshStandardMaterial({ color: 0xf4f6f9, roughness: 0.8, emissive: 0x1d2026 }), // soft white clay, shadows kept light
  earFur: new THREE.MeshStandardMaterial({ color: 0xf4f6f9, roughness: 0.8, emissive: 0x1d2026, vertexColors: true, side: THREE.DoubleSide }),
  shadedFur: new THREE.MeshStandardMaterial({ color: 0xf4f6f9, roughness: 0.8, emissive: 0x1d2026, vertexColors: true }),
  bead: new THREE.MeshStandardMaterial({ color: 0x16171a, roughness: 0.12, metalness: 0.1 }),
  shine: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }),
  mouth: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide }), // inside, coloured per point
};

const part = (geometry, material, x = 0, y = 0, z = 0) => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = material !== M.shine;
  mesh.receiveShadow = false; // only the ground takes its shadow: under the light from above the big head would darken the whole body
  return mesh;
};
const sphere = (r, material, x, y, z, sx = 1, sy = 1, sz = 1) => {
  const mesh = part(new THREE.SphereGeometry(r, 64, 48), material, x, y, z);
  mesh.scale.set(sx, sy, sz);
  return mesh;
};
// A surface of revolution through a smooth spline of the profile points (listed bottom to top), so no edges show.
const lathe = (points, segments = 96) => new THREE.LatheGeometry(
  new THREE.SplineCurve(points.map(([r, y]) => new THREE.Vector2(r, y))).getPoints(64), segments);

// How far the face sticks out at a point of the head, so the eyes and the mouth sit right on it.
function faceZ(x, y) {
  const r = headRadius(y);
  return (HEAD.rz / HEAD.rx) * Math.sqrt(Math.max(0, r * r - x * x));
}

// The head's shape, as in the reference: a round dome on top and, below the middle, a squarish bottom with very
// rounded corners (a superellipse: sides nearly upright, bottom nearly flat, no seam anywhere), so it reads as a
// soft bun rather than an egg. Radius at each height, head coordinates.
const HEAD_BOTTOM = HEAD.y - HEAD.ry;
const HEAD_SQUARENESS = 3.2; // 2 would be the round egg; the higher, the squarer the bottom

function headRadius(y) {
  const k = Math.min(1, Math.abs(y - HEAD.y) / HEAD.ry);
  const power = y >= HEAD.y ? 2 : HEAD_SQUARENESS; // the dome stays round
  return HEAD.rx * Math.max(0, 1 - k ** power) ** (1 / power);
}

function headShape() {
  const top = HEAD.y + HEAD.ry, steps = 96;
  const points = [new THREE.Vector2(0.001, HEAD_BOTTOM)];
  for (let i = 0; i <= steps; i += 1) { // dense near the corner, where the outline turns fastest
    const t = i / steps, y = HEAD_BOTTOM + (top - HEAD_BOTTOM) * (1 - Math.cos((t * Math.PI) / 2)) ** 0.8;
    points.push(new THREE.Vector2(Math.max(0.001, headRadius(Math.min(y, top))), Math.min(y, top)));
  }
  const geometry = new THREE.LatheGeometry(points, 96);
  geometry.computeVertexNormals();
  return geometry;
}

// ---- head ----

function eye(side) {
  const x = side * 0.36, y = 0.5;
  const group = new THREE.Group();
  group.position.set(x, y, faceZ(x, y) - 0.005); // a little bead standing slightly out of the face
  group.rotation.set(0.04, side * 0.43, 0); // follows the face, which is upright below the dome
  group.add(sphere(0.085, M.bead, 0, 0, 0, 1, 1.22, 0.72));
  const big = sphere(0.018, M.shine, -0.028, 0.045, 0.05);
  const small = sphere(0.008, M.shine, 0.025, -0.04, 0.05);
  group.add(big, small);
  group.userData = { shines: [big, small], rest: [big.position.clone(), small.position.clone()] };
  return group;
}

// The little "w" mouth: a soft black line running along the face.
const MOUTH_LINE = [[-0.135, 0.43], [-0.095, 0.4], [-0.05, 0.395], [-0.015, 0.425], [0, 0.428], [0.015, 0.425], [0.05, 0.395], [0.095, 0.4], [0.135, 0.43]];

function mouth() {
  const points = MOUTH_LINE
    .map(([x, y]) => new THREE.Vector3(x, y, faceZ(x, y) + 0.014)); // raised a little above the face
  const path = new THREE.CatmullRomCurve3(points);
  const group = new THREE.Group();
  group.add(part(new THREE.TubeGeometry(path, 64, 0.02, 12), M.bead));
  for (const end of [0, 1]) group.add(part(new THREE.SphereGeometry(0.02, 12, 10), M.bead, ...path.getPoint(end).toArray()));
  return group;
}

// The open mouth it talks with, cut along the "w" line: the line is its upper lip, its corners are the line's ends,
// and below it the mouth drops open, dark inside with a pink tongue at the bottom, as far as the talk level says
// (open(0..1)); every point stays on the face. Shut, it is hidden.
const MOUTH_DEPTH = 0.15; // how far down it opens, wide open, in head units
const MOUTH_COLS = 40, MOUTH_ROWS = 8;
const MOUTH_INSIDE = new THREE.Color(0x5e1a28), MOUTH_TONGUE = new THREE.Color(0xff8aa0);

function talkingMouth() {
  const line = new THREE.CatmullRomCurve3(MOUTH_LINE.map(([x, y]) => new THREE.Vector3(x, y, 0)));
  const lip = line.getPoints(MOUTH_COLS).map((point) => [point.x, point.y - 0.008]); // the line hides the seam
  const count = (MOUTH_COLS + 1) * (MOUTH_ROWS + 1);
  const positions = new Float32Array(count * 3), normals = new Float32Array(count * 3), colors = new Float32Array(count * 3);
  const index = [], color = new THREE.Color();
  for (let row = 0; row <= MOUTH_ROWS; row += 1) {
    for (let col = 0; col <= MOUTH_COLS; col += 1) {
      const i = row * (MOUTH_COLS + 1) + col, middle = 1 - Math.abs((2 * col) / MOUTH_COLS - 1);
      normals[i * 3 + 2] = 1;
      color.copy(MOUTH_INSIDE).lerp(MOUTH_TONGUE, smoothstep(0.5, 0.95, row / MOUTH_ROWS) * smoothstep(0.25, 0.75, middle));
      color.toArray(colors, i * 3);
      if (row < MOUTH_ROWS && col < MOUTH_COLS) {
        const below = i + MOUTH_COLS + 1;
        index.push(i, below, i + 1, i + 1, below, below + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(index);
  const mesh = new THREE.Mesh(geometry, M.mouth);
  mesh.visible = false;
  mesh.frustumCulled = false; // its points move every frame

  function open(level) {
    mesh.visible = level > 0.03;
    if (!mesh.visible) return;
    for (let row = 0; row <= MOUTH_ROWS; row += 1) {
      for (let col = 0; col <= MOUTH_COLS; col += 1) {
        const [x, top] = lip[col], i = row * (MOUTH_COLS + 1) + col;
        const y = top - MOUTH_DEPTH * level * Math.pow(Math.sin((Math.PI * col) / MOUTH_COLS), 0.6) * (row / MOUTH_ROWS);
        positions.set([x, y, faceZ(x, y) + 0.006], i * 3); // on the face, under the line
      }
    }
    geometry.attributes.position.needsUpdate = true;
  }

  return { mesh, open };
}

// A big soft pointed ear on its own pivot at the base, so it can twitch and wiggle.
const EAR = [[0.001, -0.12], [0.26, -0.1], [0.285, 0.0], [0.24, 0.15], [0.15, 0.3], [0.06, 0.4], [0.001, 0.43]];
const EAR_HOLLOW = 1.45; // how deep the front of the ear is scooped out (1 would reach the middle)
const EAR_SHADE = new THREE.Color(0xd9dbe2); // the inside of the ear is a little in shadow

const smoothstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// The ear's front is scooped out into a deep hollow with a soft rolled rim around it, and shaded inside.
function earShell() {
  const geometry = lathe(EAR);
  const position = geometry.attributes.position;
  const colors = [];
  const fur = new THREE.Color(0xffffff);
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    const r = Math.hypot(x, z) || 1, front = Math.max(0, z / r); // 1 straight ahead, 0 at the sides and behind
    const depth = Math.pow(front, 3) * smoothstep(-0.07, 0.04, y) * (1 - smoothstep(0.24, 0.38, y));
    position.setZ(i, z * (1 - EAR_HOLLOW * depth));
    const shade = fur.clone().lerp(EAR_SHADE, depth);
    colors.push(shade.r, shade.g, shade.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function ear(side) {
  const pivot = new THREE.Group();
  pivot.position.set(side * 0.47, 1.1, -0.06);
  pivot.scale.setScalar(1.15);
  const tilt = new THREE.Group(); // leans out and a little forward, like the reference
  tilt.rotation.set(0.12, -side * 0.25, -side * 0.34);
  const shell = part(earShell(), M.earFur);
  shell.scale.set(1, 1, 0.6);
  tilt.add(shell);
  pivot.add(tilt);
  return pivot;
}

function head() {
  const group = new THREE.Group();
  group.position.y = NECK_Y - HIP_Y;
  const skull = part(headShape(), M.fur);
  skull.scale.z = HEAD.rz / HEAD.rx;
  group.add(skull);
  const eyes = [eye(-1), eye(1)];
  const ears = [ear(-1), ear(1)];
  const talking = talkingMouth();
  group.add(...eyes, mouth(), talking.mesh, ...ears);
  return { group, eyes, ears, mouth: talking };
}

// ---- body ----

function arm(side) {
  const shoulder = new THREE.Group();
  shoulder.position.set(side * 0.37, 0.44, 0.02);
  shoulder.add(sphere(0.1, M.fur, side * 0.03, -0.11, 0.02, 0.9, 1.5, 0.95)); // a stubby little arm
  return shoulder;
}

// A short tail curling up from behind the body: thin where it grows, swelling into a round thick tip.
// It sways on its own pivot at the base.
const TAIL = { base: 0.05, tip: 0.105 };

function tail() {
  const pivot = new THREE.Group();
  pivot.position.set(0.3, 0.0, -0.2); // from the back of the right side, so it shows beside the body, as in the reference
  const path = new THREE.CatmullRomCurve3([[0, 0, 0], [0.15, 0.01, -0.01], [0.27, 0.09, 0.02], [0.31, 0.21, 0.05]]
    .map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const segments = 48, sides = 24;
  const geometry = new THREE.TubeGeometry(path, segments, 1, sides);
  const position = geometry.attributes.position, center = new THREE.Vector3(), point = new THREE.Vector3();
  for (let ring = 0; ring <= segments; ring += 1) { // taper each ring around its point on the path
    const t = ring / segments;
    path.getPointAt(t, center);
    const radius = TAIL.base + (TAIL.tip - TAIL.base) * smoothstep(0.2, 1, t);
    for (let k = 0; k <= sides; k += 1) {
      const i = ring * (sides + 1) + k;
      point.fromBufferAttribute(position, i).sub(center).multiplyScalar(radius).add(center);
      position.setXYZ(i, point.x, point.y, point.z);
    }
  }
  geometry.computeVertexNormals();
  pivot.add(part(geometry, M.fur));
  pivot.add(sphere(TAIL.tip, M.fur, ...path.getPointAt(1).toArray())); // the round end
  return pivot;
}

// The body, with its top shaded where the big head hangs over it: like the soft shadow under the head in the
// reference, it makes head and body flow into one another instead of meeting in a bright seam.
const HEAD_SHADE = new THREE.Color(0xb9bcc4);

// The body's outline, bottom to top: (radius, height above the ground).
const BELLY = [[0.001, 0.06], [0.3, 0.08], [0.44, 0.2], [0.47, 0.35], [0.45, 0.5], [0.41, 0.63], [0.37, 0.74], [0.3, 0.83], [0.001, 0.88]];
const BELLY_DEPTH = 0.85;

function bellyShape(at) {
  const geometry = lathe(BELLY.map(([r, y]) => [r, at(y)]));
  const position = geometry.attributes.position, white = new THREE.Color(0xffffff), colors = [];
  for (let i = 0; i < position.count; i += 1) {
    const shade = white.clone().lerp(HEAD_SHADE, smoothstep(at(0.6), at(0.8), position.getY(i)));
    colors.push(shade.r, shade.g, shade.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

function torso() {
  const group = new THREE.Group(); // pivots at the hips
  group.position.y = HIP_Y;
  const at = (worldY) => worldY - HIP_Y;
  const belly = part(bellyShape(at), M.shadedFur); // a small pear-shaped body
  belly.scale.z = BELLY_DEPTH;
  const arms = [arm(-1), arm(1)];
  const tail_ = tail();
  const head_ = head();
  group.add(belly, ...arms, tail_, head_.group);
  return { group, belly, arms, tail: tail_, head: head_ };
}

// A soft rounded leg that swells out of the body and flows into a bun-shaped foot, without a seam.
const LEG = [[0.001, -0.29], [0.13, -0.275], [0.165, -0.22], [0.15, -0.14], [0.13, -0.05], [0.12, 0.04], [0.001, 0.08]];

function leg(side) {
  const hip = new THREE.Group();
  hip.position.set(side * 0.19, HIP_Y, 0);
  const limb = part(lathe(LEG, 64), M.fur, 0, 0.01, 0.02);
  limb.scale.set(1, 1, 1.12);
  hip.add(limb);
  hip.add(sphere(0.15, M.fur, 0, -0.205, 0.07, 1, 0.58, 1.2)); // the toes, a little forward
  return hip;
}

export function buildAvatar() {
  const root = new THREE.Group();
  const body = torso();
  const legs = [leg(-1), leg(1)];
  root.add(body.group, ...legs);
  const figure = {
    root, torso: body.group, head: body.head.group, eyes: body.head.eyes, ears: body.head.ears, arms: body.arms, legs,
    openMouth: body.head.mouth.open,
  };
  // The soft parts follow the body on springs: the tail sways and wags harder when it is happy, the ears flop a
  // little after a hop, and the belly squashes on landing.
  figure.dress = (pose, swing, t) => {
    body.tail.rotation.set(swing.sway[1] * 0.35, swing.sway[0] * 0.6 + Math.sin(t * 1.6) * 0.18, pose.earFlap * Math.sin(t * 16) * 0.45);
    body.head.ears.forEach((pivot, i) => { pivot.rotation.x = swing.sides[i] * 0.25; });
    body.belly.scale.set(1 + swing.bounce * 0.05, 1 - swing.bounce * 0.08, 0.85 * (1 + swing.bounce * 0.05));
  };
  return figure;
}

// The head's form, for costumes that must sit right on it (glasses on the face, hats on the dome), in head coordinates.
export const HEAD_FORM = { ...HEAD, faceZ, headRadius };
// The body's outline, for a suit worn over it, in torso coordinates (which start at the hips).
export const BODY_FORM = { outline: BELLY.map(([r, y]) => [r, y - HIP_Y]), depth: BELLY_DEPTH };
