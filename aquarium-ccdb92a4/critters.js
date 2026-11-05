// The tank's small folk in 3D: a jellyfish pulsing through the water (it glows at night), a crab scuttling
// sideways along the front, a shrimp hopping about, and a snail crawling up and down the driftwood.

import { TRUNK } from "./ground.js";
import { THREE, color, curve, floorAt, merge, mix, paint, solid, standard, tube } from "./kit.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const eye = (radius) => solid(new THREE.SphereGeometry(radius, 10, 8), standard({ color: "#111", roughness: 0.15 }), { receive: false });

function jelly(world) {
  const group = new THREE.Group();
  const profile = [[0, 0.46], [0.16, 0.44], [0.3, 0.36], [0.4, 0.2], [0.43, 0.04], [0.4, -0.02], [0.36, 0]].map(([x, y]) => new THREE.Vector2(x, y));
  const skin = standard({ color: "#f6b8ff", emissive: "#e070e8", emissiveIntensity: 0.2, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, roughness: 0.2 });
  const bell = new THREE.Mesh(new THREE.LatheGeometry(profile, 28), skin);
  const core = standard({ color: "#ff9cf5", emissive: "#e070e8", emissiveIntensity: 0.4, transparent: true, opacity: 0.8, depthWrite: false });
  const rings = [0, 1, 2, 3].map((k) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.016, 6, 16), core);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(Math.cos(k * 1.57) * 0.1, 0.3, Math.sin(k * 1.57) * 0.1);
    return ring;
  });
  bell.add(...rings);
  const arms = new THREE.Mesh(merge([0, 1, 2, 3].map((k) => {
    const angle = k * 1.57 + 0.4;
    return tube(Array.from({ length: 12 }, (_, i) => V(Math.cos(angle) * 0.05 + Math.sin(i * 0.9 + k) * 0.04, -i * 0.06, Math.sin(angle) * 0.05)), (s) => 0.03 * (1 - s * 0.7), 5);
  })), core);
  const count = 14, joints = 14;
  const strands = new Float32Array(count * (joints - 1) * 2 * 3);
  const lines = new THREE.BufferGeometry();
  lines.setAttribute("position", new THREE.BufferAttribute(strands, 3));
  const tentacles = new THREE.LineSegments(lines, new THREE.LineBasicMaterial({ color: "#f6a9ff", transparent: true, opacity: 0.65 }));
  tentacles.frustumCulled = false;
  const glow = new THREE.PointLight("#ff8cf0", 0, 2.6, 1.5);
  glow.position.y = 0.2;
  group.add(bell, arms, tentacles, glow);
  world.add(group);

  let height = 4.6;
  world.every((t, dt) => {
    const beat = Math.max(0, Math.sin(t * 2.1)) ** 2; // the bell squeezes, then opens slowly
    bell.scale.set(1 - beat * 0.14, 1 - beat * 0.1 + 0.04, 1 - beat * 0.14);
    height = Math.min(5.7, Math.max(3.3, height + (beat * 0.55 - 0.13) * dt));
    group.position.set(3.05 + Math.sin(t * 0.13) * 0.5, height, -0.35 + Math.sin(t * 0.09) * 0.3);
    arms.rotation.y = t * 0.3;
    let at = 0;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2, r = 0.36 * bell.scale.x;
      let px = Math.cos(angle) * r, py = 0, pz = Math.sin(angle) * r;
      for (let k = 1; k < joints; k += 1) {
        const nx = Math.cos(angle) * r * (1 - k * 0.03) + Math.sin(t * 2 + k * 0.5 + i) * 0.012 * k;
        const ny = -k * 0.075, nz = Math.sin(angle) * r * (1 - k * 0.03) + Math.cos(t * 1.7 + k * 0.45 + i) * 0.01 * k;
        strands.set([px, py, pz, nx, ny, nz], at);
        at += 6;
        [px, py, pz] = [nx, ny, nz];
      }
    }
    lines.attributes.position.needsUpdate = true;
    const night = world.light.night;
    skin.emissiveIntensity = 0.15 + night * 0.9;
    core.emissiveIntensity = 0.3 + night * 1.6;
    glow.intensity = night * 2.6;
  });
}

// One leg: thigh out to the side and up, shin down to the ground; returns its hip to swing.
function leg(material, length) {
  const hip = new THREE.Group();
  const thigh = solid(new THREE.CylinderGeometry(0.022, 0.026, length, 6), material);
  thigh.rotation.z = -1.0;
  thigh.position.set(Math.sin(1.0) * length / 2, Math.cos(1.0) * length / 2, 0);
  const knee = new THREE.Group();
  knee.position.set(Math.sin(1.0) * length, Math.cos(1.0) * length, 0);
  const shin = solid(new THREE.CylinderGeometry(0.02, 0.008, length * 1.1, 6), material);
  shin.rotation.z = 0.35;
  shin.position.set(Math.sin(0.35) * length * 0.55, -Math.cos(0.35) * length * 0.55, 0);
  knee.add(shin);
  hip.add(thigh, knee);
  return hip;
}

function crab(world) {
  const group = new THREE.Group();
  const shell = standard({ color: "#ff6a4a", roughness: 0.45 });
  const body = solid(paint(new THREE.SphereGeometry(1, 24, 14), (x, y, z) => mix(color("#a8321e"), color("#ff8a66"), y * 0.8 + 0.5 + z * 0.2)), standard({ vertexColors: true, roughness: 0.4 }));
  body.scale.set(0.3, 0.14, 0.22);
  group.add(body);
  [-1, 1].forEach((side) => {
    const stalk = solid(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 6), shell);
    stalk.position.set(side * 0.07, 0.17, 0.15);
    const ball = eye(0.032);
    ball.position.set(side * 0.07, 0.24, 0.15);
    group.add(stalk, ball);
  });
  const legs = [];
  [-1, 1].forEach((side) => {
    const flank = new THREE.Group();
    flank.scale.x = side;
    for (let k = 0; k < 4; k += 1) {
      const hip = leg(shell, 0.2);
      hip.position.set(0.22, -0.02, 0.1 - k * 0.08);
      hip.rotation.y = -0.4 + k * 0.28;
      flank.add(hip);
      legs.push({ hip, phase: k * 1.6 + (side > 0 ? 0 : 0.8) });
    }
    const arm = solid(new THREE.CylinderGeometry(0.03, 0.035, 0.24, 6), shell);
    arm.rotation.set(1.1, 0, -0.7);
    arm.position.set(0.24, 0.06, 0.2);
    const claw = new THREE.Group();
    claw.position.set(0.33, 0.13, 0.3);
    const palm = solid(new THREE.SphereGeometry(0.075, 12, 8), shell);
    palm.scale.set(1, 0.75, 1.3);
    const finger = solid(new THREE.ConeGeometry(0.03, 0.12, 6), shell);
    finger.rotation.x = Math.PI / 2;
    finger.position.set(0, 0.04, 0.1);
    const thumb = solid(new THREE.ConeGeometry(0.035, 0.13, 6), shell);
    thumb.rotation.x = Math.PI / 2;
    thumb.position.set(0, -0.02, 0.11);
    claw.add(palm, finger, thumb);
    flank.add(arm, claw);
    legs.push({ finger, side });
    group.add(flank);
  });
  world.add(group);
  const z = 1.55;
  world.every((t) => {
    const phase = (t % 14) / 14; // across, a rest, and back
    const along = phase < 0.45 ? phase / 0.45 : phase < 0.55 ? 1 : 1 - (phase - 0.55) / 0.45;
    const walking = phase < 0.45 || phase > 0.55;
    const x = -3 + 3.4 * (along * along * (3 - 2 * along));
    group.position.set(x, floorAt(x, z) + 0.17, z);
    legs.forEach(({ hip, phase: offset, finger }) => {
      if (hip) hip.rotation.z = walking ? Math.sin(t * 14 + offset) * 0.22 : 0;
      if (finger) finger.rotation.x = Math.PI / 2 - Math.max(0, Math.sin(t * 5)) * 0.5;
    });
    group.rotation.z = walking ? Math.sin(t * 14) * 0.03 : 0;
  });
}

function shrimp(world) {
  const group = new THREE.Group();
  const spine = Array.from({ length: 14 }, (_, k) => { // from the head (+x) arching up and curling down to the tail
    const a = (k / 13) * 3.6;
    return V(Math.cos(a) * 0.17, Math.sin(a) * 0.12, 0);
  });
  const body = paint(tube(spine, (s) => 0.055 * (1 - s * 0.6), 10), (x, y, z) => mix(color("#ff7a5e"), color("#ffd2c2"), y * 3 + 0.4 + Math.sin(x * 60) * 0.12));
  const fan = new THREE.ConeGeometry(0.05, 0.08, 4);
  fan.scale(1, 1, 0.3);
  fan.rotateZ(2.4);
  fan.translate(spine.at(-1).x - 0.03, spine.at(-1).y - 0.04, 0);
  const shell = solid(merge([body, paint(fan, color("#ff9d8a"))]), standard({ vertexColors: true, roughness: 0.35, transparent: true, opacity: 0.92 }));
  const head = spine[0];
  const feelers = new THREE.BufferGeometry();
  feelers.setAttribute("position", new THREE.Float32BufferAttribute([
    head.x, head.y, 0.02, head.x + 0.35, head.y + 0.25, 0.08, head.x, head.y, -0.02, head.x + 0.4, head.y + 0.12, -0.06,
    0.1, 0.03, 0, 0.12, -0.06, 0.02, 0.03, 0.06, 0, 0.03, -0.06, 0.02, -0.05, 0.05, 0, -0.07, -0.06, 0.02,
  ], 3));
  const whiskers = new THREE.LineSegments(feelers, new THREE.LineBasicMaterial({ color: "#fff3ee" }));
  const look = eye(0.022);
  look.position.set(head.x - 0.02, head.y + 0.05, 0.04);
  group.add(shell, whiskers, look);
  group.scale.setScalar(1.6);
  world.add(group);
  let from = 0.1, facing = 1;
  const z = 1.3;
  world.every((t) => {
    const phase = (t % 5) / 5;
    if (phase < 0.02 && group.userData.hopped) group.userData.hopped = false;
    const hop = phase > 0.6 && phase < 0.8 ? (phase - 0.6) / 0.2 : phase >= 0.8 ? 1 : 0;
    if (phase >= 0.8 && !group.userData.hopped) { // landed: next time hop from here, turning back at the ends
      group.userData.hopped = true;
      from += facing * 0.45;
      if (from > 0.9 || from < -0.6) facing = -facing;
    }
    const x = phase >= 0.8 ? from : from + facing * 0.45 * hop;
    group.position.set(x, floorAt(x, z) + 0.1 + Math.sin(hop * Math.PI) * 0.45, z);
    group.rotation.y = facing > 0 ? 0 : Math.PI;
    group.rotation.z = Math.sin(hop * Math.PI) * 0.3;
  });
}

function snail(world) {
  const group = new THREE.Group();
  const flesh = paint(tube(curve(V(-0.17, 0, 0), V(0, 0.01, 0), V(0.17, 0.04, 0), 10), (s) => 0.025 + s * 0.035, 10), color("#dcc39d"));
  flesh.scale(1, 0.6, 1);
  const horns = [-1, 1].map((side) => tube(curve(V(0.15, 0.05, side * 0.02), V(0.19, 0.11, side * 0.04), V(0.2, 0.16, side * 0.05), 5), () => 0.008, 5));
  const coil = Array.from({ length: 48 }, (_, k) => {
    const turn = (k / 47) * Math.PI * 4.5, r = 0.11 * Math.exp(-0.16 * turn);
    return V(Math.cos(turn) * r, Math.sin(turn) * r, (k / 47) * 0.02);
  });
  const shell = paint(tube(coil, (s) => 0.075 * Math.exp(-1.9 * s) + 0.005, 12), (x, y, z) => mix(color("#8f5a32"), color("#f0c48e"), 0.5 + Math.sin(Math.atan2(y, x) * 9) * 0.3 + y * 2));
  shell.translate(-0.02, 0.17, 0);
  const mesh = solid(merge([flesh, ...horns.map((horn) => paint(horn, color("#cdb38c"))), shell]), standard({ vertexColors: true, roughness: 0.45 }));
  group.add(mesh);
  [-1, 1].forEach((side) => {
    const ball = eye(0.014);
    ball.position.set(0.2, 0.165, side * 0.05);
    group.add(ball);
  });
  world.add(group);
  const up = V(0, 1, 0), forward = new THREE.Vector3(), side = new THREE.Vector3(), basis = new THREE.Matrix4();
  world.every((t) => {
    const phase = (t % 90) / 90; // up the wood for 45 s, then down again
    const s = 0.12 + 0.7 * (phase < 0.5 ? phase * 2 : 2 - phase * 2);
    const at = TRUNK.curve.getPointAt(s);
    TRUNK.curve.getTangentAt(s, forward);
    if (phase >= 0.5) forward.negate();
    side.crossVectors(forward, up).normalize();
    const normal = new THREE.Vector3().crossVectors(side, forward).normalize();
    basis.makeBasis(forward, normal, side);
    group.quaternion.setFromRotationMatrix(basis);
    group.position.copy(at).addScaledVector(normal, TRUNK.radius(s) * 0.92);
  });
}

export function releaseCritters(world) {
  jelly(world);
  crab(world);
  shrimp(world);
  snail(world);
}

