import * as THREE from "three";

// --- GLSL shaders ------------------------------------------------------

import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

// --- Three.js setup ----------------------------------------------------

const canvas = document.querySelector("#webgl");
const scene = new THREE.Scene();

const size = 16;
const res = 256;
const watergeo = new THREE.PlaneGeometry(size, size, res, res);
const wiregeo = new THREE.WireframeGeometry(watergeo);

const uniforms = {
  time:   { value: 0.0 },
  amp1:   { value: 0.2 },
  amp2:   { value: 0.15 },
  freq1:  { value: 0.75 },
  freq2:  { value: 1.5 },
  speed1: { value: 0.1 },
  speed2: { value: 0.2 },
};

const watermat = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms,
  transparent: false,
  depthWrite: true,
});

const wiremat = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader: `
    varying float vHeight;
    void main() { gl_FragColor = vec4(vec3(1.0), 1.0); }
  `,
  uniforms,
  transparent: true,
  depthWrite: false,
})

const mesh = new THREE.Mesh(watergeo, watermat);
const wire = new THREE.LineSegments(wiregeo, wiremat);

const watersurf = new THREE.Group();
watersurf.add(mesh);
//watersurf.add(wire);
watersurf.rotation.z = -Math.PI / 8;
scene.add(watersurf);


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

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();