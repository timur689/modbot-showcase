// A real-looking white cat asleep on a ledge, after the owner's reference figurine: a long body, the hind leg folded
// along its side, the head resting on one front paw while the other hangs over the edge, the tail raised behind.
// A round head with full cheeks, a short muzzle, a pink nose and a little smile, big ears pink inside, whiskers,
// eyes behind lids (green-gold, slit pupils). The fur is made of shells: thin copies of the skin lifted along its
// normals, each one keeping fewer hairs, darker at the roots.
// Units: the cat is about 1.2 long; it lies on y = 0, its front towards +z, its head to the right.

import { THREE, color, curve, merge, mix, noise, paint, painted, smoothNormals, tube } from "./kit.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SHELLS = 12;
const FUR = Object.freeze({ white: "#f6f3ee", cream: "#efe2cf", shade: "#c9c4bd", nose: "#e79aa4", ear: "#f0b3b9" });

// ---- fur ----

function furPatch(shader, shell, length, density) {
  shader.uniforms.uShell = { value: shell };
  shader.uniforms.uLength = { value: length };
  shader.uniforms.uDensity = { value: density };
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nuniform float uShell; uniform float uLength; varying vec3 vBase;")
    .replace("#include <begin_vertex>", `#include <begin_vertex>
      vBase = position;
      transformed += normalize(objectNormal) * uShell * uLength;
      transformed.y -= uShell * uShell * uLength * 0.25;`);
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", `#include <common>
      uniform float uShell; uniform float uDensity; varying vec3 vBase;
      float furHash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }`)
    .replace("#include <map_fragment>", `#include <map_fragment>
      if (uShell > 0.0 && furHash(floor(vBase * uDensity)) < uShell * 0.82) discard;
      diffuseColor.rgb *= mix(0.8, 1.03, uShell);`);
}

// The skin and its shells of fur, all sharing one geometry (so a moving tail moves its fur too).
export function furry(geometry, { length = 0.03, density = 120 } = {}) {
  const group = new THREE.Group();
  for (let k = 0; k <= SHELLS; k += 1) {
    const shell = k / SHELLS;
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, envMapIntensity: 0.4 });
    material.onBeforeCompile = (shader) => furPatch(shader, shell, length, density);
    material.customProgramCacheKey = () => "fur";
    const layer = new THREE.Mesh(geometry, material);
    layer.castShadow = k === 0;
    layer.renderOrder = k;
    group.add(layer);
  }
  return group;
}

// White fur, a little creamy along the back, greyer underneath and in the folds.
const coat = (geometry) => paint(geometry, (x, y, z, nx, ny) => {
  const base = mix(color(FUR.white), color(FUR.cream), Math.max(0, ny) * 0.35 + noise(x * 9, y * 9, z * 9) * 0.12);
  return mix(base, color(FUR.shade), Math.max(0, -ny) * 0.55 + Math.max(0, 0.06 - y) * 4);
});

const blob = (r, [sx, sy, sz], [x, y, z]) => {
  const geometry = new THREE.SphereGeometry(r, 36, 24);
  geometry.scale(sx, sy, sz);
  geometry.translate(x, y, z);
  return geometry;
};

// Lying down, the underside flattens against the lid.
function flatten(geometry, floor = 0.05) {
  const { position } = geometry.attributes;
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i);
    if (y < floor) position.setY(i, floor - (floor - y) * 0.25);
  }
  return smoothNormals(geometry);
}

// ---- the body, lying on a ledge as in the owner's reference: rump and tail to the left, head to the right on
// its far paw, the hind leg folded along the side, the near front leg reaching over the ledge's edge ----

export const LEDGE = 0.34; // the ledge's front edge, from the middle of the cat
export const ELBOW = Object.freeze(V(0.27, 0.035, LEDGE)); // where the near front leg bends down over the edge

export function body() {
  const spine = new THREE.CatmullRomCurve3([V(-0.34, 0.15, 0.0), V(-0.12, 0.175, -0.03), V(0.14, 0.17, 0.0), V(0.3, 0.14, 0.06)]).getPoints(22);
  const torso = tube(spine, (s) => 0.14 + 0.02 * Math.sin(Math.PI * s) + 0.03 * Math.exp(-(((s - 0.2) / 0.15) ** 2)), 22);
  const leg = (from, via, to) => tube(curve(V(...from), V(...via), V(...to), 10), (s) => 0.058 - s * 0.012, 12);
  const parts = [
    torso,
    blob(1, [0.17, 0.14, 0.13], [-0.25, 0.14, 0.1]),      // the hip, the thigh folded along the side
    blob(1, [0.1, 0.045, 0.06], [-0.1, 0.04, 0.19]),      // the hind paw, tucked forward under it
    blob(1, [0.14, 0.135, 0.15], [0.25, 0.135, 0.07]),    // the chest and shoulder
    leg([0.3, 0.08, 0.0], [0.45, 0.05, 0.03], [0.56, 0.048, 0.06]), // the far front leg, the head lies on it
    blob(1, [0.075, 0.042, 0.065], [0.59, 0.043, 0.065]),
    leg([0.24, 0.09, 0.14], [0.255, 0.055, 0.26], ELBOW.toArray()), // the near one, to the edge
  ];
  return coat(flatten(merge(parts)));
}

// The near forearm hanging over the edge, from the elbow (its pivot) down to a soft round paw with toes.
export function forearm() {
  const limb = tube(curve(V(0, 0, 0), V(0.005, -0.09, 0.03), V(0.01, -0.165, 0.04), 10), (s) => 0.054 - s * 0.012, 12);
  const toes = [-0.03, 0, 0.03].map((x) => blob(1, [0.025, 0.025, 0.023], [0.013 + x, -0.245, 0.078]));
  return coat(merge([limb, blob(1, [0.064, 0.068, 0.06], [0.013, -0.21, 0.052]), ...toes]));
}

// ---- the head (built facing +z, centred at its own origin) ----

// The texture wraps the whole eyeball (u round it, v top to bottom): the iris is the patch facing forward.
const iris = () => painted(256, 128, (ctx, w, h) => {
  ctx.fillStyle = "#24331b";
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(1, h / w * 2); // a circle on the eyeball is twice as tall in v as in u
  const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, w * 0.16);
  grad.addColorStop(0, "#e2c84e");
  grad.addColorStop(0.5, "#a9c24c");
  grad.addColorStop(0.92, "#557f36");
  grad.addColorStop(1, "#24331b");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, w * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0b0b0c";
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.012, w * 0.11, 0, 0, Math.PI * 2); // the slit pupil
  ctx.fill();
  ctx.restore();
});

function eye(side, irisMap) {
  const group = new THREE.Group();
  group.position.set(side * 0.052, 0.012, 0.098);
  group.rotation.set(0, side * 0.32, side * -0.22);
  group.scale.set(1.25, 0.8, 0.8); // almond-shaped
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.026, 24, 16), new THREE.MeshStandardMaterial({ map: irisMap, roughness: 0.05, envMapIntensity: 1.2 }));
  ball.rotation.y = -Math.PI / 2; // the sphere's texture centre looks forward
  const lid = new THREE.Group();
  const skin = new THREE.Mesh(new THREE.SphereGeometry(0.0295, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: FUR.white, roughness: 0.9 }));
  const lashes = new THREE.Mesh(new THREE.TorusGeometry(0.0295, 0.0032, 6, 32), new THREE.MeshStandardMaterial({ color: "#3b3330", roughness: 0.6 }));
  lashes.rotation.x = Math.PI / 2;
  lid.add(skin, lashes);
  group.add(ball, lid);
  return { group, lid };
}

function ear(side) {
  const pivot = new THREE.Group();
  pivot.position.set(side * 0.075, 0.085, -0.01);
  pivot.rotation.set(-0.15, side * -0.25, side * -0.38);
  const outer = new THREE.Mesh(new THREE.ConeGeometry(0.058, 0.11, 24, 1, true), new THREE.MeshStandardMaterial({ color: FUR.white, roughness: 0.9, side: THREE.DoubleSide }));
  outer.scale.z = 0.5;
  outer.position.y = 0.05;
  const inner = new THREE.Mesh(new THREE.ConeGeometry(0.044, 0.088, 24, 1, true), new THREE.MeshStandardMaterial({ color: FUR.ear, roughness: 0.7, side: THREE.DoubleSide }));
  inner.scale.z = 0.35;
  inner.position.set(0, 0.045, 0.012);
  pivot.add(outer, inner);
  return pivot;
}

function whiskers() {
  const lines = [];
  [-1, 1].forEach((side) => {
    [-0.015, 0, 0.015].forEach((drop, k) => {
      lines.push(side * 0.035, -0.045 + drop * 0.3, 0.145, side * (0.2 + k * 0.02), -0.06 + drop * 2.5, 0.11 - k * 0.01);
    });
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
  return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.75 }));
}

export function head() {
  const group = new THREE.Group();
  const skull = coat(merge([
    blob(0.13, [1, 0.86, 0.92], [0, 0, 0]),
    blob(0.075, [1, 0.85, 0.9], [-0.065, -0.04, 0.055]), // full cheeks
    blob(0.075, [1, 0.85, 0.9], [0.065, -0.04, 0.055]),
    blob(0.05, [1.15, 0.75, 0.9], [0, -0.045, 0.105]),   // the muzzle
    blob(0.034, [1, 0.8, 0.9], [0, -0.078, 0.088]),      // the chin
  ]));
  group.add(furry(skull, { length: 0.009, density: 340 }));
  const irisMap = iris();
  const eyes = [eye(-1, irisMap), eye(1, irisMap)];
  const ears = [ear(-1), ear(1)];
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 10), new THREE.MeshStandardMaterial({ color: FUR.nose, roughness: 0.4 }));
  nose.scale.set(1.25, 0.7, 0.8);
  nose.position.set(0, -0.022, 0.153);
  const mouth = new THREE.Group(); // only seen in a yawn: dark inside, a pink tongue
  mouth.position.set(0, -0.065, 0.128);
  const inside = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), new THREE.MeshStandardMaterial({ color: "#5a2a2e", roughness: 0.8 }));
  inside.scale.set(1, 1, 0.5);
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), new THREE.MeshStandardMaterial({ color: "#e88b95", roughness: 0.5 }));
  tongue.scale.set(1, 0.4, 1);
  tongue.position.set(0, -0.015, 0.01);
  mouth.add(inside, tongue);
  mouth.scale.set(1, 0.001, 1);
  const lips = new THREE.Mesh(merge([-1, 1].map((side) => tube(curve(V(0, -0.033, 0.152), V(side * 0.014, -0.05, 0.151), V(side * 0.032, -0.042, 0.145), 8), () => 0.0032, 5))),
    new THREE.MeshStandardMaterial({ color: "#7a5a5c", roughness: 0.6 })); // a contented little smile
  group.add(...eyes.map((e) => e.group), ...ears, nose, mouth, lips, whiskers());
  return { group, eyes, ears, mouth };
}

// ---- the tail: its shape is redrawn every frame from `points` ----

const TAIL_POINTS = 26, TAIL_SIDES = 12;
const tailRadius = (s) => 0.046 - s * 0.012;

export function tail(points) {
  const geometry = coat(tube(points, tailRadius, TAIL_SIDES));
  const reshape = (next) => {
    const fresh = tube(next, tailRadius, TAIL_SIDES);
    geometry.attributes.position.array.set(fresh.attributes.position.array);
    geometry.attributes.normal.array.set(fresh.attributes.normal.array);
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.normal.needsUpdate = true;
    geometry.computeBoundingSphere();
    fresh.dispose();
  };
  return { mesh: furry(geometry, { length: 0.02, density: 240 }), reshape, count: TAIL_POINTS };
}

