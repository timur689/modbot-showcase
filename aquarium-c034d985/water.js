// The water itself: its surface seen from below (a rippling, silvery sheet, as in a real tank), shafts of lamp
// light slanting down through it, and soft halos for whatever glows (castle windows, the jellyfish at night).

import { SURFACE } from "./world.js";
import { THREE, mix, painted, rand } from "./kit.js";

const WHITE = new THREE.Color("#ffffff");

// The underside of the surface: little waves running across it, catching the lamp and the colour of the water.
export function waterSurface(world) {
  const geometry = new THREE.PlaneGeometry(26, 9.4, 52, 18);
  geometry.rotateX(Math.PI / 2); // facing down, into the water
  geometry.translate(0, SURFACE, -2.6);
  const material = new THREE.MeshStandardMaterial({
    roughness: 0.06, metalness: 0.15, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 2.2,
  });
  const sheet = new THREE.Mesh(geometry, material);
  world.add(sheet);
  const { position } = geometry.attributes;
  world.every((t) => {
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i), z = position.getZ(i);
      position.setY(i, SURFACE + 0.035 * Math.sin(x * 1.8 + t * 1.4) + 0.025 * Math.sin(z * 2.6 - t * 1.1 + x * 0.5));
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    const light = world.light;
    material.color.copy(mix(light.top, WHITE, 0.3));
    material.emissive.copy(light.top).multiplyScalar(0.18 + light.power * 0.04);
  });
}

const SHAFT_VERTEX = `varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SHAFT_FRAGMENT = `uniform vec3 uColor; uniform float uStrength; uniform float uTime; uniform float uSeed; varying vec2 vUv;
  void main() {
    float across = smoothstep(0.0, 0.5, vUv.x) * smoothstep(1.0, 0.5, vUv.x);
    float down = pow(vUv.y, 1.8);
    float flicker = 0.7 + 0.2 * sin(uTime * 0.7 + uSeed * 3.0) + 0.1 * sin(uTime * 1.9 + uSeed * 7.0);
    gl_FragColor = vec4(uColor * across * across * down * uStrength * flicker, 1.0);
  }`;

// Shafts of light from the lamp, fanning out a little and breathing; plants and fish pass in front of them.
export function lightShafts(world) {
  const shafts = [-3.1, -1.8, -0.5, 0.6, 1.8, 3.1].map((x, k) => {
    const height = rand(6, 7.5), width = rand(0.45, 1.1);
    const material = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color() }, uStrength: { value: 0 }, uTime: { value: 0 }, uSeed: { value: k * 1.7 } },
      vertexShader: SHAFT_VERTEX, fragmentShader: SHAFT_FRAGMENT,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const geometry = new THREE.PlaneGeometry(width, height);
    geometry.translate(0, -height / 2, 0); // hangs down from the surface
    const shaft = new THREE.Mesh(geometry, material);
    shaft.position.set(x, SURFACE, rand(-2.2, 0.6));
    shaft.rotation.z = x * 0.05; // leaning away from the lamp in the middle of the lid
    shaft.rotation.y = rand(-0.3, 0.3);
    world.add(shaft);
    return material;
  });
  world.every((t) => {
    shafts.forEach((material) => {
      material.uniforms.uTime.value = t;
      material.uniforms.uColor.value.copy(world.light.lamp);
      material.uniforms.uStrength.value = world.light.shafts;
    });
  });
}

let haloTexture = null;

// A soft round glow (additive), `size` across.
export function halo(tone, size) {
  haloTexture = haloTexture || painted(64, 64, (ctx, w, h) => {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.25, "rgba(255,255,255,0.45)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture, color: tone, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  sprite.scale.setScalar(size);
  return sprite;
}
