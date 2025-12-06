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

const tintcolor = 0x35354A;
scene.background = new THREE.Color(tintcolor);

const customUniforms = {
  time:   { value: 0.0 },
  amp1:   { value: 2.0 },
  freq1:  { value: 0.3 },
  speed1: { value: 0.25 },

  amp2:   { value: 0.6 },
  freq2:  { value: 1.5 },
  speed2: { value: 0.5 },

  amp3: { value: 0.06 },
  freq3: { value: 1.0 },
  speed3: { value: 1.2 },

  amp4: { value: 0.04 },
  freq4: { value: 1.0 },
  speed4: { value: 1.5 },

  steep: { value: 1.0 },

  color1: { value: RgbToVec3(255, 0, 0) },
  color2: { value: RgbToVec3(0, 255, 0) },

  // color1: { value: RgbToVec3(0, 0, 0) },
  // color2: { value: RgbToVec3(53, 53, 74) },

  fogColor: { value: new THREE.Color(tintcolor) },
  fogDensity: { value: 0.08 },
};

const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.lights, customUniforms]);

const watermat = new THREE.ShaderMaterial({
  vertexShader: watervertex,
  fragmentShader: waterfragment,
  uniforms,
  fog: true,
  transparent: false,
  depthWrite: true,
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
//scene.fog = new THREE.FogExp2(tintcolor, 0.15);

// Camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, -3, 0.25);
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
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;

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
