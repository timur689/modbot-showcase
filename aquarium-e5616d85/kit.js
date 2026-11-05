// Shared helpers for the 3D aquarium: three.js itself (the panel's own copy, published next to the cat), random
// numbers and a smooth noise, the shape of the bottom, tapered tubes and leaf ribbons, merged parts with painted
// vertex colours, canvas textures, and the water current that sways whatever grows.

import * as THREE from "../cat-e5616d85/vendor/three.module.min.js";

export { THREE };

export const rand = (min, max) => min + Math.random() * (max - min);
export const pick = (list) => list[Math.floor(Math.random() * list.length)];
export const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
export const smooth = (from, to, value) => {
  const t = clamp((value - from) / (to - from), 0, 1);
  return t * t * (3 - 2 * t);
};

// A cheap smooth noise in about [-1, 1]: skewed sine waves, enough for rocks, bark and sand.
export function noise(x, y, z) {
  return (
    Math.sin(x * 1.7 + Math.sin(y * 2.3) + z * 0.6) +
    Math.sin(y * 1.9 + Math.sin(z * 2.9) - x * 0.8) +
    Math.sin(z * 2.1 + Math.sin(x * 1.3) + y * 0.7)
  ) / 3;
}

// The bottom: flat-ish in front, rising into low hills at the back; sand adds ripples on top.
export function floorAt(x, z, ripple = 0) {
  const back = z < -1.2 ? Math.pow(-1.2 - z, 1.45) * 0.42 : 0;
  const hills = (Math.sin(x * 0.55 + 1.3) * 0.5 + Math.sin(x * 1.3 + 0.4) * 0.22) * smooth(-1, -4.5, z);
  const swell = 0.08 * Math.sin(x * 0.7 + z * 0.9);
  const ripples = ripple * 0.035 * Math.sin(x * 4.2 + z * 1.5 + Math.sin(z * 2) * 1.2);
  return 0.35 + back + hills + swell + ripples;
}

export const color = (hex) => new THREE.Color(hex);
export const mix = (a, b, t) => a.clone().lerp(b, clamp(t, 0, 1));

// Vertex colours from `paint(x, y, z, nx, ny, nz)` → THREE.Color.
export function paint(geometry, painter) {
  const { position, normal } = geometry.attributes;
  const colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i += 1) {
    const c = typeof painter === "function"
      ? painter(position.getX(i), position.getY(i), position.getZ(i), normal.getX(i), normal.getY(i), normal.getZ(i))
      : painter;
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

// How much each vertex is moved by the current: 0 at `low`, 1 at `high` (by height).
export function swayByHeight(geometry, low, high) {
  const { position } = geometry.attributes;
  const sway = new Float32Array(position.count);
  for (let i = 0; i < position.count; i += 1) sway[i] = smooth(low, high, position.getY(i));
  geometry.setAttribute("aSway", new THREE.BufferAttribute(sway, 1));
  return geometry;
}

// Smooth normals for a geometry without an index: faces meeting at the same point share one normal.
export function smoothNormals(geometry) {
  const geo = geometry.index ? geometry.toNonIndexed() : geometry;
  geo.computeVertexNormals();
  const { position, normal } = geo.attributes;
  const key = (i) => `${position.getX(i).toFixed(4)},${position.getY(i).toFixed(4)},${position.getZ(i).toFixed(4)}`;
  const sums = new Map();
  for (let i = 0; i < position.count; i += 1) {
    const sum = sums.get(key(i)) || new THREE.Vector3();
    sums.set(key(i), sum.add(new THREE.Vector3(normal.getX(i), normal.getY(i), normal.getZ(i))));
  }
  for (let i = 0; i < position.count; i += 1) {
    const n = sums.get(key(i)).normalize();
    normal.setXYZ(i, n.x, n.y, n.z);
  }
  return geo;
}

// Moves every vertex of a round geometry out from its centre by `bump(x, y, z)` (a lumpy rock, a fuzzy moss ball).
export function lump(geometry, bump) {
  const geo = geometry.index ? geometry.toNonIndexed() : geometry;
  const { position } = geo.attributes;
  const v = new THREE.Vector3();
  for (let i = 0; i < position.count; i += 1) {
    v.fromBufferAttribute(position, i);
    const out = v.clone().normalize().multiplyScalar(bump(v.x, v.y, v.z));
    position.setXYZ(i, v.x + out.x, v.y + out.y, v.z + out.z);
  }
  return smoothNormals(geo);
}

// Parallel-transported frames along a polyline, so tubes and ribbons never twist on their own.
function frames(points) {
  const n = points.length;
  const tangents = points.map((_, i) => new THREE.Vector3().subVectors(points[Math.min(i + 1, n - 1)], points[Math.max(i - 1, 0)]).normalize());
  let normal = Math.abs(tangents[0].y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  normal = normal.sub(tangents[0].clone().multiplyScalar(normal.dot(tangents[0]))).normalize();
  return tangents.map((tangent, i) => {
    if (i > 0) {
      const axis = new THREE.Vector3().crossVectors(tangents[i - 1], tangent);
      const length = axis.length();
      if (length > 1e-6) normal.applyAxisAngle(axis.divideScalar(length), Math.acos(clamp(tangents[i - 1].dot(tangent), -1, 1)));
    }
    return { tangent, normal: normal.clone(), binormal: new THREE.Vector3().crossVectors(tangent, normal) };
  });
}

// A tube along `points`, `radius(s)` thick at s ∈ [0, 1] along it, closed at both ends.
export function tube(points, radius, radial = 8) {
  const n = points.length;
  const positions = [], normals = [], index = [];
  frames(points).forEach(({ normal, binormal }, i) => {
    const r = radius(i / (n - 1));
    for (let j = 0; j <= radial; j += 1) {
      const a = (j / radial) * Math.PI * 2;
      const dir = normal.clone().multiplyScalar(Math.cos(a)).addScaledVector(binormal, Math.sin(a));
      positions.push(points[i].x + dir.x * r, points[i].y + dir.y * r, points[i].z + dir.z * r);
      normals.push(dir.x, dir.y, dir.z);
    }
  });
  for (let i = 0; i < n - 1; i += 1) {
    for (let j = 0; j < radial; j += 1) {
      const a = i * (radial + 1) + j, b = a + radial + 1;
      index.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  [[0, -1], [n - 1, 1]].forEach(([ring, side]) => { // caps
    const centre = positions.length / 3;
    const tangent = new THREE.Vector3().subVectors(points[Math.min(ring + 1, n - 1)], points[Math.max(ring - 1, 0)]).normalize().multiplyScalar(side);
    positions.push(points[ring].x, points[ring].y, points[ring].z);
    normals.push(tangent.x, tangent.y, tangent.z);
    for (let j = 0; j < radial; j += 1) {
      const a = ring * (radial + 1) + j;
      if (side > 0) index.push(a + 1, centre, a);
      else index.push(a, centre, a + 1);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(index);
  return geometry;
}

// A leaf along `points`: `width(s)` wide, folded a little along its midrib so it catches the light, its blade
// facing `side` at the root and turning by `twist` towards the tip. Root dark, tip bright (`root` → `tip`).
export function ribbon(points, width, side, { twist = 0, fold = 0.18, root, tip }) {
  const n = points.length;
  const positions = [], index = [];
  frames(points).forEach(({ tangent }, i) => {
    const s = i / (n - 1);
    const lateral = side.clone().applyAxisAngle(tangent, twist * s);
    lateral.sub(tangent.clone().multiplyScalar(lateral.dot(tangent))).normalize();
    const face = new THREE.Vector3().crossVectors(tangent, lateral);
    const w = width(s) / 2, p = points[i];
    positions.push(
      p.x - lateral.x * w, p.y - lateral.y * w, p.z - lateral.z * w,
      p.x + face.x * w * fold, p.y + face.y * w * fold, p.z + face.z * w * fold,
      p.x + lateral.x * w, p.y + lateral.y * w, p.z + lateral.z * w,
    );
  });
  for (let i = 0; i < n - 1; i += 1) {
    for (let j = 0; j < 2; j += 1) {
      const a = i * 3 + j, b = a + 3;
      index.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  const colors = [], sway = [];
  for (let i = 0; i < n; i += 1) {
    const s = i / (n - 1), c = mix(root, tip, s);
    for (let j = 0; j < 3; j += 1) {
      const rib = j === 1 ? 1.12 : 1;
      colors.push(c.r * rib, c.g * rib, c.b * rib);
      sway.push(s);
    }
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("aSway", new THREE.Float32BufferAttribute(sway, 1));
  return geometry;
}

// Points along a quadratic curve from `from` through `via` to `to`.
export function curve(from, via, to, count = 12) {
  return new THREE.QuadraticBezierCurve3(from, via, to).getPoints(count - 1);
}

const ATTRIBUTES = [["position", 3, 0], ["normal", 3, 0], ["color", 3, 1], ["aSway", 1, 0]];

// One geometry out of many parts (each moved into place already); missing colours are white, missing sway is 0.
export function merge(parts) {
  const flat = parts.map((part) => (part.index ? part.toNonIndexed() : part));
  const total = flat.reduce((sum, part) => sum + part.attributes.position.count, 0);
  const geometry = new THREE.BufferGeometry();
  ATTRIBUTES.forEach(([name, size, fill]) => {
    const array = new Float32Array(total * size);
    let offset = 0;
    flat.forEach((part) => {
      const attribute = part.attributes[name], count = part.attributes.position.count;
      if (attribute) array.set(attribute.array.subarray(0, count * size), offset);
      else array.fill(fill, offset, offset + count * size);
      offset += count * size;
    });
    geometry.setAttribute(name, new THREE.BufferAttribute(array, size));
  });
  return geometry;
}

// A texture painted on a canvas by `draw(ctx, width, height)`.
export function painted(width, height, draw, { repeat = null, colour = true } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d"), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  if (colour) texture.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat[0], repeat[1]);
  }
  texture.anisotropy = 4;
  return texture;
}

export const standard = (options) => new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0, ...options });

export function solid(geometry, material, { cast = true, receive = true } = {}) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

// The water current: everything grown sways by its aSway (0 at the root, 1 at the tip), each plant in its own
// rhythm (from where it stands). The shadow follows the same sway.
const clock = { value: 0 };
export const setClock = (seconds) => { clock.value = seconds; };
export const now = () => clock.value;

function patchSway(shader, reach) {
  shader.uniforms.uTime = clock;
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nattribute float aSway;\nuniform float uTime;")
    .replace("#include <begin_vertex>", `#include <begin_vertex>
      float phase = modelMatrix[3][0] * 1.3 + modelMatrix[3][2] * 2.1;
      float bend = aSway * aSway * ${reach.toFixed(3)};
      transformed.x += sin(uTime * 0.8 + phase + position.y * 0.5) * bend;
      transformed.z += sin(uTime * 0.6 + phase * 1.7 + position.y * 0.4) * bend * 0.5;`);
}

export function swaying(mesh, reach = 0.3) {
  const key = () => `sway-${reach}`;
  mesh.material.onBeforeCompile = (shader) => patchSway(shader, reach);
  mesh.material.customProgramCacheKey = key;
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  depth.onBeforeCompile = (shader) => patchSway(shader, reach);
  depth.customProgramCacheKey = key;
  mesh.customDepthMaterial = depth;
  return mesh;
}

// Leaves and everything thin: lit on both sides, coloured per vertex, swaying.
export const leafy = (options = {}) => standard({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.62, ...options });
