// The fish in 3D: a body shaped like a real fish's (blunt head, slim tail stalk), its own painted skin, fins that
// wag and flap, glossy eyes. Each swims its own looping path through the tank, turning smoothly where it goes:
// the clownfish (the cat watches it), the royal gramma, the blue tang, a school of neon tetras and the puffer.

import { THREE, clamp, merge, painted, rand, solid, standard } from "./kit.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP_MAX = 0.45; // how steeply a fish may climb or dive, in radians

// The body: a sphere stretched along x (head at +x), slimmer towards the tail. The skin's texture runs head (top
// of the canvas) to tail (bottom), and around the body: back (left edge), side, belly (middle), side, back.
function bodyGeometry(length, height, width) {
  const geometry = new THREE.SphereGeometry(1, 36, 20);
  geometry.rotateZ(-Math.PI / 2);
  const { position } = geometry.attributes;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const slim = x < 0 ? 1 - 0.62 * Math.pow(-x, 1.5) : 1 - 0.12 * Math.pow(x, 4);
    const belly = position.getY(i) < 0 ? 1.06 : 1;
    position.setXYZ(i, x * length, position.getY(i) * height * slim * belly, position.getZ(i) * width * slim);
  }
  geometry.computeVertexNormals();
  return geometry;
}

const skin = (paint) => painted(256, 128, (ctx, w, h) => paint(ctx, w, h));

// Darker back, paler belly, over any skin.
function countershade(ctx, w, h, dark = 0.25, light = 0.3) {
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, `rgba(0,0,0,${dark})`);
  grad.addColorStop(0.3, "rgba(0,0,0,0)");
  grad.addColorStop(0.5, `rgba(255,255,255,${light})`);
  grad.addColorStop(0.7, "rgba(0,0,0,0)");
  grad.addColorStop(1, `rgba(0,0,0,${dark})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

const SKINS = {
  clown: (ctx, w, h) => {
    ctx.fillStyle = "#ff7a1a";
    ctx.fillRect(0, 0, w, h);
    [[0.3, 0.1], [0.55, 0.12], [0.84, 0.07]].forEach(([at, size]) => {
      ctx.fillStyle = "#1d1d1f";
      ctx.fillRect(0, (at - size / 2 - 0.02) * h, w, (size + 0.04) * h);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, (at - size / 2) * h, w, size * h);
    });
    countershade(ctx, w, h, 0.18, 0.2);
  },
  gramma: (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#7a3fff");
    grad.addColorStop(0.42, "#a45cff");
    grad.addColorStop(0.58, "#ffc22e");
    grad.addColorStop(1, "#ffb21a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    countershade(ctx, w, h, 0.2, 0.15);
  },
  tang: (ctx, w, h) => {
    ctx.fillStyle = "#1f62e6";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#121a30";
    [0.25, 0.75].forEach((side) => { // the dark "palette" on each flank, with a blue window in it
      ctx.beginPath();
      ctx.ellipse(side * w, h * 0.55, w * 0.13, h * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#3d86ff";
    [0.25, 0.75].forEach((side) => {
      ctx.beginPath();
      ctx.ellipse(side * w, h * 0.5, w * 0.05, h * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#ffd23a";
    ctx.fillRect(0, h * 0.94, w, h * 0.06);
    countershade(ctx, w, h, 0.25, 0.25);
  },
  tetra: (ctx, w, h) => {
    ctx.fillStyle = "#c9d6dc";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#33e6ff";
    [0.16, 0.84].forEach((x) => ctx.fillRect((x - 0.06) * w, h * 0.08, w * 0.12, h * 0.8));
    ctx.fillStyle = "#ff3b6b";
    [0.33, 0.67].forEach((x) => ctx.fillRect((x - 0.08) * w, h * 0.5, w * 0.16, h * 0.45));
    countershade(ctx, w, h, 0.35, 0.35);
  },
  puffer: (ctx, w, h) => {
    ctx.fillStyle = "#e8c35a";
    ctx.fillRect(0, 0, w, h);
    const belly = ctx.createLinearGradient(0, 0, w, 0);
    belly.addColorStop(0.3, "rgba(255,251,230,0)");
    belly.addColorStop(0.5, "rgba(255,251,230,1)");
    belly.addColorStop(0.7, "rgba(255,251,230,0)");
    ctx.fillStyle = belly;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(122,84,20,0.55)";
    for (let k = 0; k < 70; k += 1) {
      const x = Math.random() * w;
      if (Math.abs(x / w - 0.5) < 0.14) continue; // no spots on the belly
      ctx.beginPath();
      ctx.arc(x, rand(0.1, 0.9) * h, rand(2, 4), 0, Math.PI * 2);
      ctx.fill();
    }
  },
};

function fin(points, material) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  return solid(new THREE.ShapeGeometry(shape, 6), material, { cast: false, receive: false });
}

const finMaterial = (tone, opacity = 0.88) => standard({ color: tone, side: THREE.DoubleSide, transparent: opacity < 1, opacity, roughness: 0.55 });

// A whole fish, head along +x, `length` from snout to the base of the tail.
function makeFish({ length, height, width, paint, tail, fins, tailShape = "round", small = false }) {
  const fish = new THREE.Group();
  const body = solid(bodyGeometry(length / 2, height / 2, width / 2), standard({ map: skin(paint), roughness: 0.38 }));
  fish.add(body);
  const tailPivot = new THREE.Group();
  tailPivot.position.x = -length * 0.43;
  const span = height * 0.55, reach = length * 0.38;
  const tailPoints = tailShape === "fork"
    ? [[0, span * 0.18], [-reach, span], [-reach * 0.72, 0], [-reach, -span], [0, -span * 0.18]]
    : [[0, span * 0.2], [-reach * 0.8, span * 0.9], [-reach, span * 0.4], [-reach * 1.02, 0], [-reach, -span * 0.4], [-reach * 0.8, -span * 0.9], [0, -span * 0.2]];
  tailPivot.add(fin(tailPoints, finMaterial(tail)));
  fish.add(tailPivot);
  const top = height / 2, l = length / 2;
  fish.add(
    fin([[-l * 0.55, top * 0.6], [-l * 0.2, top * 1.45], [l * 0.25, top * 1.3], [l * 0.45, top * 0.75]], finMaterial(fins)),
    fin([[-l * 0.6, -top * 0.5], [-l * 0.35, -top * 1.3], [0, -top * 1.1], [l * 0.05, -top * 0.75]], finMaterial(fins)),
  );
  const flappers = (small ? [] : [-1, 1]).map((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(l * 0.3, -top * 0.15, side * width * 0.42);
    const paddle = fin([[0, 0], [-l * 0.35, top * 0.25], [-l * 0.42, -top * 0.15], [-l * 0.1, -top * 0.2]], finMaterial(fins, 0.75));
    paddle.rotation.x = side * 0.5;
    pivot.add(paddle);
    fish.add(pivot);
    return { pivot, side };
  });
  [-1, 1].forEach((side) => {
    const ball = solid(new THREE.SphereGeometry(height * 0.11, 12, 10), standard({ color: "#0d0d10", roughness: 0.08 }), { cast: false, receive: false });
    ball.position.set(l * 0.66, top * 0.22, side * width * 0.32);
    if (!small) { // a catchlight; tiny fish do without
      const glint = new THREE.Mesh(new THREE.SphereGeometry(height * 0.03, 6, 6), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
      glint.position.set(height * 0.04, height * 0.05, side * height * 0.07);
      ball.add(glint);
    }
    fish.add(ball);
  });
  const animate = (t, rate = 1) => {
    tailPivot.rotation.y = Math.sin(t * 9 * rate) * 0.45;
    body.rotation.y = -Math.sin(t * 9 * rate) * 0.05;
    flappers.forEach(({ pivot, side }) => { pivot.rotation.y = side * (0.3 + Math.sin(t * 7 * rate) * 0.35); });
  };
  return { fish, animate };
}

// A looping path through the water: (t) → point, from sine waves along each axis.
const path = ({ x = [0, 3.6, 0.21, 0], y = [3.2, 1.2, 0.33, 1], z = [-0.4, 0.9, 0.17, 2] }) => (t, out) =>
  out.set(x[0] + x[1] * Math.sin(t * x[2] + x[3]), y[0] + y[1] * Math.sin(t * y[2] + y[3]), z[0] + z[1] * Math.sin(t * z[2] + z[3]));

// Turns `object` to face where it is heading (along `velocity`), smoothly.
const turnTo = (() => {
  const euler = new THREE.Euler(0, 0, 0, "YZX"), want = new THREE.Quaternion();
  return (object, velocity, dt, rate = 4) => {
    const flat = Math.hypot(velocity.x, velocity.z);
    if (flat < 1e-5 && Math.abs(velocity.y) < 1e-5) return;
    euler.set(0, Math.atan2(-velocity.z, velocity.x), clamp(Math.atan2(velocity.y, flat), -UP_MAX, UP_MAX));
    want.setFromEuler(euler);
    object.quaternion.slerp(want, 1 - Math.exp(-dt * rate));
  };
})();

function swimmer(world, made, route, speed = 1) {
  const at = V(0, 0, 0), ahead = V(0, 0, 0), velocity = V(0, 0, 0);
  world.add(made.fish);
  world.every((t, dt) => {
    const s = t * speed;
    route(s, at);
    route(s + 0.05, ahead);
    velocity.subVectors(ahead, at);
    made.fish.position.copy(at);
    turnTo(made.fish, velocity, dt || 1);
    made.animate(t, 0.8 + velocity.length() * 8);
  });
  return made.fish;
}

function school(world) {
  const leader = path({ x: [0, 3.8, 0.17, 1], y: [5, 0.7, 0.29, 0], z: [-0.8, 0.8, 0.13, 3] });
  const at = V(0, 0, 0), ahead = V(0, 0, 0), velocity = V(0, 0, 0);
  const members = Array.from({ length: 8 }, (_, k) => {
    const made = makeFish({ length: 0.42, height: 0.14, width: 0.08, paint: SKINS.tetra, tail: "#c9d6dc", fins: "#e6eef2", tailShape: "fork", small: true });
    world.add(made.fish);
    return { ...made, offset: V(rand(-0.6, 0.6), rand(-0.35, 0.35), rand(-0.5, 0.5)), seed: k * 1.3, lag: rand(0, 0.25) };
  });
  world.every((t, dt) => {
    members.forEach(({ fish, animate, offset, seed, lag }) => {
      const s = t - lag;
      leader(s, at);
      leader(s + 0.05, ahead);
      velocity.subVectors(ahead, at);
      fish.position.copy(at).add(offset).add(V(Math.sin(t * 1.3 + seed) * 0.12, Math.sin(t * 1.7 + seed) * 0.08, 0));
      turnTo(fish, velocity, dt || 1, 6);
      animate(t + seed, 1.4);
    });
  });
}

function puffer(world) {
  const made = makeFish({ length: 0.75, height: 0.55, width: 0.5, paint: SKINS.puffer, tail: "#e8c35a", fins: "#f3c24a" });
  const spines = new THREE.Mesh(merge(Array.from({ length: 40 }, () => { // spread over the body, pointing out
    const dir = V(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize();
    const cone = new THREE.ConeGeometry(0.018, 0.08, 5);
    cone.translate(0, 0.04, 0);
    cone.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir));
    cone.translate(dir.x * 0.34, dir.y * 0.25, dir.z * 0.23);
    return cone;
  })), standard({ color: "#c99a35" }));
  made.fish.add(spines);
  const fish = swimmer(world, made, path({ x: [0.3, 3.2, 0.11, 2], y: [2.2, 0.6, 0.23, 2], z: [0, 0.7, 0.09, 1] }));
  world.every((t) => {
    const phase = (t % 8) / 8; // now and then it puffs up, holds, and lets go
    const puff = phase < 0.72 ? 0 : phase < 0.78 ? (phase - 0.72) / 0.06 : phase < 0.9 ? 1 : 1 - (phase - 0.9) / 0.1;
    fish.scale.setScalar(1 + puff * 0.5);
    spines.scale.setScalar(0.9 + puff * 0.14); // the spines stand up out of the swollen body
  });
}

// Releases every fish; returns the clownfish, which the cat watches.
export function releaseFish(world) {
  const clown = swimmer(world,
    makeFish({ length: 0.8, height: 0.42, width: 0.24, paint: SKINS.clown, tail: "#ff8a2a", fins: "#ff9a3c" }),
    path({ x: [-0.3, 3.2, 0.2, 0], y: [3.1, 1.1, 0.31, 1], z: [-0.1, 0.9, 0.15, 2] }));
  swimmer(world,
    makeFish({ length: 0.62, height: 0.3, width: 0.16, paint: SKINS.gramma, tail: "#ffc22e", fins: "#b98cff" }),
    path({ x: [0.4, 3.4, 0.16, 3], y: [2, 0.6, 0.27, 0], z: [-0.6, 0.8, 0.12, 0] }), 1.1);
  swimmer(world,
    makeFish({ length: 0.85, height: 0.5, width: 0.18, paint: SKINS.tang, tail: "#ffd23a", fins: "#183c8a", tailShape: "fork" }),
    path({ x: [0, 3.5, 0.13, 1.5], y: [3.8, 1, 0.21, 2.4], z: [-0.9, 1, 0.1, 0.7] }));
  school(world);
  puffer(world);
  return clown;
}
