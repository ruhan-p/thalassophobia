import * as THREE from "three";

import watervertex from "./shaders/watervertex.glsl";
import waterfragment from "./shaders/waterfragment.glsl";

const canvas = document.querySelector("#webgl");
const scene = new THREE.Scene();

const meshsize = 24;
const res = 320;
const watergeo = new THREE.PlaneGeometry(meshsize, meshsize, res, res);

function RgbToVec3(r, g, b) {
  return new THREE.Vector3(r / 255, g / 255, b / 255);
}

const tintcolor = 0x373F45;
scene.background = new THREE.Color(tintcolor);
scene.fog = new THREE.FogExp2(tintcolor, 0.10);

// Camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, -10, 0);
scene.add(camera);

const getWaveInfo = (x, y, t) => {
  const { amp1, amp2, freq1, freq2, speed1, speed2 } = customUniforms;

  let h = 0; let dx = 0; let dy = 0;

  const calc = (amp, freq, speed, sign) => {
    const theta = x * freq.value + t * speed.value * sign;
    const phi   = y * freq.value + t * speed.value * sign;

    const val = Math.sin(theta) * Math.sin(phi) * amp.value;
    // calculus!
    const ddx = amp.value * freq.value * Math.cos(theta) * Math.sin(phi);
    const ddy = amp.value * freq.value * Math.sin(theta) * Math.cos(phi);

    h  += val; dx += ddx; dy += ddy;
  };

  calc(amp1, freq1, speed1, 1);
  calc(amp2, freq2, speed2, -1);

  return { h, dx, dy };
};

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x020617);

// Uniforms
const customUniforms = {
  time: { value: 0.0 },
  amp1: { value: 0.6 },
  amp2: { value: 0.5 },
  freq1: { value: 0.5 },
  freq2: { value: 0.8 },
  speed1: { value: 0.25 },
  speed2: { value: 0.20 },
  amp3: { value: 0.12 },
  amp4: { value: 0.12 },
  freq3: { value: 1.0 },
  freq4: { value: 0.8 },
  speed3: { value: 0.2 },
  speed4: { value: 0.4 },
  steep: { value: 1.0 },
  smallIterations: { value: 4.0 },

  opacityNear: { value: 7.0 },
  opacityFar: { value: 9.0 },

  color1: { value: RgbToVec3(3, 6, 10) },
  color2: { value: RgbToVec3(20, 25, 30) },
  fogColor: { value: new THREE.Color(tintcolor) },
  fogDensity: { value: 0.08 },
};

const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.lights, customUniforms]);

const watermat = new THREE.ShaderMaterial({
  vertexShader: watervertex,
  fragmentShader: waterfragment,
  uniforms,
  fog: true,
  transparent: true,
  depthWrite: false,
  lights: true,
  extensions: { derivatives: true },
});

const mesh = new THREE.Mesh(watergeo, watermat);

const watersurf = new THREE.Group();
watersurf.add(mesh);
watersurf.rotation.z = -Math.PI / 8;
scene.add(watersurf);

// Floor
const seafloor = new THREE.Mesh(new THREE.PlaneGeometry(meshsize, meshsize), new THREE.MeshBasicMaterial({color: 0x000}));
seafloor.position.set(0, 0, -1.5); seafloor.rotation.z = -Math.PI / 8;
scene.add(seafloor);

// Light
const light = new THREE.PointLight(0xcacaca, 2, 0);
light.position.set(-15, 25, 4);
scene.add(light);

// Lightning
const lightning = new THREE.PointLight(0x0000ff, 10, 0);
lightning.position.set(-25,25,15);
scene.add(lightning);

// Resize
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Animation loop
const wp = new THREE.Vector3();
const lNormal = new THREE.Vector3();
const wNormal = new THREE.Vector3();
const smooth = new THREE.Vector3(0, 0, 1); 
const clock = new THREE.Clock();

function tick() {
  const t = clock.getElapsedTime();
  uniforms.time.value = t;

  wp.copy(camera.position);
  watersurf.worldToLocal(wp);

  const { h, dx, dy } = getWaveInfo(wp.x, wp.y, t);

  const targetZ = h; 
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.1);

  lNormal.set(-dx, -dy, 1).normalize();
  wNormal.copy(lNormal).transformDirection(watersurf.matrixWorld);

  smooth.lerp(wNormal, 0.05);
  camera.up.copy(smooth);

  camera.lookAt(0, 0, 0);
  
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();
