import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// --- GLSL shaders ------------------------------------------------------

import watervertex from "./shaders/watervertex.glsl";
import waterfragment from "./shaders/waterfragment.glsl";
import wirefragment from "./shaders/wirefragment.glsl";
// --- Three.js setup ----------------------------------------------------

const canvas = document.querySelector("#webgl");
const scene = new THREE.Scene();

const size = 16;
const res = 512;
const watergeo = new THREE.PlaneGeometry(size, size, res, res);
const wiregeo = new THREE.WireframeGeometry(watergeo);

function RgbToVec3(r, g, b) {
  return new THREE.Vector3(r / 255, g / 255, b / 255);
}

const tintcolor = 0x373F45;
scene.background = new THREE.Color(tintcolor);

const customUniforms = {

  time: { value: 0.0 },
  amp1: { value: 0.6 },
  amp2: { value: 0.5 },
  freq1: { value: 0.5 },
  freq2: { value: 0.8 },
  speed1: { value: 0.25 },
  speed2: { value: 0.20 },
  amp3: { value: 0.2 },
  amp4: { value: 0.15 },
  freq3: { value: 1.0 },
  freq4: { value: 0.8 },
  speed3: { value: 0.3 },
  speed4: { value: 0.3 },
  steep: { value: 1.0 },
  smallIterations: { value: 4.0 },
  opacity: { value: 0.65 },

  // uTime: { value: 0.0 },
  // uBigWavesElevation: { value: 0.16 },
  // uBigWavesFrequency: { value: new THREE.Vector2(4, 4) },
  // uBigWavesSpeed: { value: 3 },
  // uSmallWavesElevation: { value: 0.15},
  // uSmallWavesFrequency: { value: 3 },
  // uSmallWavesSpeed: { value: 0.14 },
  // uSmallIterations: { value: 5 },

  // color1: { value: RgbToVec3(255, 0, 0) },
  // color2: { value: RgbToVec3(0, 255, 0) },

  color1: { value: RgbToVec3(4, 6, 6) },
  color2: { value: RgbToVec3(45, 52, 57) },

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

const wiremat = new THREE.ShaderMaterial({
  vertexShader: watervertex,
  fragmentShader: wirefragment,
  uniforms,
  fog: true,
  transparent: true,
  depthWrite: false
})

const mesh = new THREE.Mesh(watergeo, watermat);
const wire = new THREE.LineSegments(wiregeo, wiremat);

const watersurf = new THREE.Group();
watersurf.add(mesh);
//watersurf.add(wire);
watersurf.rotation.z = -Math.PI / 8;
scene.add(watersurf);

// Light
const light = new THREE.DirectionalLight(0xcccccc, 0.8);
light.position.set(-5, 0, 5);
scene.add(light);

// Fog
scene.fog = new THREE.FogExp2(tintcolor, 0.10);

// Camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, -8, 1);
camera.lookAt(0, 0, 0);
scene.add(camera);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x020617);

// Controls
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.target.set(0, 0, 0);
// controls.enableDamping = true;

// Handle resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Animation loop
const clock = new THREE.Clock();

function tick() {
  uniforms.time.value = clock.getElapsedTime();

  //controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();
