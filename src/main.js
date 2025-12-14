import * as THREE from "three";

// Post-Processing Imports
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { VignetteShader } from "three/examples/jsm/shaders/VignetteShader.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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
scene.fog = new THREE.FogExp2(tintcolor, 0.08);

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

    // calculus!
    const val = Math.sin(theta) * Math.sin(phi) * amp.value;
    const ddx = amp.value * freq.value * Math.cos(theta) * Math.sin(phi);
    const ddy = amp.value * freq.value * Math.sin(theta) * Math.cos(phi);

    h  += val; dx += ddx; dy += ddy;
  };

  calc(amp1, freq1, speed1, 1);
  calc(amp2, freq2, speed2, -1);

  return { h, dx, dy };
};

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1);
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
  opacityNear: { value: 0.0 },
  opacityFar: { value: 3.0 },
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

// Buoy
// const loader = new GLTFLoader();
// loader.load( 'path/to/model.glb', function ( gltf ) {
//   scene.add( gltf.scene );

// }, undefined, function ( error ) {
//   console.error( error );
// } );

// Lightning


// Rain
const rainCount = 2500;

let drops = [];
for (let i = 0; i < rainCount; i ++) {
  let drop = new THREE.Vector3(0,0,0);
  drops.push(drop);
}
const raingeo = new THREE.BufferGeometry().setFromPoints(drops);

const velocities = new Float32Array(rainCount * 3);
raingeo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
const rainvel = raingeo.attributes.velocity;
const rainpos = raingeo.attributes.position;

const rainmat = new THREE.LineBasicMaterial({
  color: 0x8899aa,
  transparent: true,
  opacity: 0.6,
  linewidth: 1
});

const rain = new THREE.LineSegments(raingeo, rainmat);
scene.add(rain);

// Post
const composer = new EffectComposer(renderer);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bokehPass = new BokehPass(scene, camera, {
  focus: 20.0,
  aperture: 0.0005,
  maxblur: 0.02,
  width: window.innerWidth,
  height: window.innerHeight
});
bokehPass.materialBokeh.defines['RINGS'] = 3;
bokehPass.materialBokeh.defines['SAMPLES'] = 2;
bokehPass.materialBokeh.needsUpdate = true;
composer.addPass(bokehPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,
  0.4,
  0.85
);
bloomPass.clearColor = new THREE.Color(0xffffff);

bloomPass.threshold = 0.5;
bloomPass.strength = 0.6;
bloomPass.radius = 1.0;
composer.addPass(bloomPass);

const vignettePass = new ShaderPass(VignetteShader);
vignettePass.uniforms["offset"].value = 0.6;
vignettePass.uniforms["darkness"].value = 1.4;
composer.addPass(vignettePass);

// Resize
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  composer.setSize(width, height);
});

// Animation loop
const wp = new THREE.Vector3();
const lNormal = new THREE.Vector3();
const wNormal = new THREE.Vector3();
const smooth = new THREE.Vector3(0, 0, 1); 
const clock = new THREE.Clock();

const offset = Math.random() * 1000;

function tick() {
  const t = clock.getElapsedTime() + offset;
  uniforms.time.value = t;

  const wx = 2 * Math.cos(t*0.05 + 56.78);
  const wy = 0.1 * Math.sin(t*0.02 + 134.57);

  // Camera loop
  wp.copy(camera.position);
  watersurf.worldToLocal(wp);

  const { h, dx, dy } = getWaveInfo(wp.x, wp.y, t);

  const targetZ = h;
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.1);

  bokehPass.uniforms['focus'].value = 10.0;

  lNormal.set(-dx, -dy, 1).normalize();
  wNormal.copy(lNormal).transformDirection(watersurf.matrixWorld);

  smooth.lerp(wNormal, 0.05);
  camera.up.copy(smooth);
  camera.lookAt(0, 0, 0);

  // Rain loop
  for (let i = 0; i < rainpos.count; i += 2) {
    
    const x = rainpos.getX(i); const y = rainpos.getY(i); const z = rainpos.getZ(i);
    const tx = rainpos.getX(i + 1); const ty = rainpos.getY(i + 1); const tz = rainpos.getZ(i + 1);

    const fallSpeed = 0.4;

    if (z < -1) {
      const vx = (wx + 0.05 * (Math.random() - 0.5)) * 0.05;
      const vy = (wy + 0.05 * (Math.random() - 0.5)) * 0.05;

      const px = (Math.random() - 0.5) * 15.0 + 1.0;
      const py = (Math.random() - 0.5) * 15.0 - 6.0;
      const newZ = Math.random() * 10 + 5;

      rainpos.setXYZ(i, px, py, newZ);
      rainpos.setXYZ(i + 1, px + vx, py + vy, newZ - 0.2 - (Math.random() * 0.05));

      rainvel.setXYZ(i, vx, vy, 0);     
      rainvel.setXYZ(i + 1, vx, vy, 0); 
      
      continue;
    }

    const vx = rainvel.getX(i);
    const vy = rainvel.getY(i);

    rainpos.setXYZ(i, x + vx, y + vy, z - fallSpeed);
    rainpos.setXYZ(i + 1, tx + vx, ty + vy, tz - fallSpeed);
  }

  rainvel.needsUpdate = true;
  rainpos.needsUpdate = true;

  composer.render();
  requestAnimationFrame(tick);
}

tick();