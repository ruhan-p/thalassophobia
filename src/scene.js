import * as THREE from "three";
import { audio, thunderAudio, creakingAudio, tintDefaultHex, waterDefaultHex } from "./ui.js";
import { postprocessingenabled, rainenabled, buoyenabled, thunderenabled } from "./ui.js";

// Post-Processing Imports
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { VignetteShader } from "three/examples/jsm/shaders/VignetteShader.js";
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import watervertex from "./shaders/watervertex.glsl";
import waterfragment from "./shaders/waterfragment.glsl";

const canvas = document.querySelector("#webgl");
const scene = new THREE.Scene();

const meshsize = 24;
const res = 320;
const watergeo = new THREE.PlaneGeometry(meshsize, meshsize, res, res);

function hexToVec3(hex) {
  const parsed = hex.replace("#", "");
  const num = parseInt(parsed, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return new THREE.Vector3(r / 255, g / 255, b / 255);
}

const tintcolor = tintDefaultHex || 0x555a5f;
const watercolor = waterDefaultHex || "#141a20";
const flashcolor = 0xb4c1d1;
const tintColorBase = new THREE.Color(tintcolor);

scene.background = tintColorBase.clone();
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
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
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
  color1: { value: hexToVec3('#020406') },
  color2: { value: hexToVec3(watercolor) },
  fogColor: { value: tintColorBase.clone() },
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
const light = new THREE.PointLight(0xcacaca, 1, 0);
light.position.set(-15, 25, 4);
scene.add(light);

// Buoy
const buoyLightColor = 0xff8f80;
const buoyGroup = new THREE.Group();
buoyGroup.position.set(0.8, -8, 0);
scene.add(buoyGroup);

const buoyLight = new THREE.PointLight(buoyLightColor, 0.1, 40);
buoyLight.position.set(0, 0, 0.5);
buoyGroup.add(buoyLight);

const buoyLightObj = new THREE.Mesh(new THREE.SphereGeometry(0.02, 32), new THREE.MeshStandardMaterial({
  emissive: buoyLightColor,
  metalness: 0,
  roughness: 1
}));
buoyLightObj.position.set(0, 0, 0.39);
buoyGroup.add(buoyLightObj);

const buoyLight2 = new THREE.PointLight(0xffffff, 0.4, 30);
buoyLight2.position.set(-1, 0, 0.5);
buoyGroup.add(buoyLight2);

const loader = new OBJLoader();
loader.load( '../assets/buoy.obj', function ( obj ) {
  obj.rotation.set(Math.PI/2, 0, 0);
  obj.scale.set(0.03, 0.03, 0.03);

  const texLoader = new THREE.TextureLoader();
  const colortex = texLoader.load("../assets/buoy_basecolor.png");
  const roughnesstex = texLoader.load("../assets/buoy_roughness.png");

  colortex.colorSpace = THREE.SRGBColorSpace;
  roughnesstex.colorSpace = THREE.NoColorSpace;

  obj.traverse((child) => {
    if (child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({
        map: colortex,
        roughnessMap: roughnesstex,
        metalness: 0.1
      });
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  buoyGroup.add(obj);

}, undefined, function ( error ) {
  console.error( error );
} );

// Audio
function getRand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function playRandomThunder() {
  const t = getRand(thunderAudio);
  t.currentTime = 0;
  t.play().catch(() => {});
}

function playRandomCreaking(rate) {
  const c = getRand(creakingAudio);
  c.currentTime = 0;
  c.playbackRate = rate;
  c.play().catch(() => {});
}

// Lightning
const lightning = {
  active: false,
  intensity: 0,
  next: 3.0,
  duration: 0.0,
  baseColor: tintColorBase.clone(),
  flashColor: new THREE.Color(flashcolor),
};

function applyTintColor(hex) {
  tintColorBase.set(hex);
  scene.background.copy(tintColorBase);
  scene.fog.color.copy(tintColorBase);
  customUniforms.fogColor.value.copy(tintColorBase);
  lightning.baseColor.copy(tintColorBase);
}

document.addEventListener("tintcolor-change", (event) => {
  if (event?.detail) {
    applyTintColor(event.detail);
  }
});
applyTintColor(tintcolor);

document.addEventListener("watercolor-change", (event) => {
  if (event?.detail) {
    uniforms.color2.value = hexToVec3(event.detail);
  }
});

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
  1.0,
  0.4,
  0.8
);
bloomPass.clearColor = new THREE.Color(0xffffff);

bloomPass.threshold = 0.5;
bloomPass.strength = 0.6;
bloomPass.radius = 1.0;
composer.addPass(bloomPass);

const vignettePass = new ShaderPass(VignetteShader);
vignettePass.uniforms["offset"].value = 0.9;
vignettePass.uniforms["darkness"].value = 1.2;
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
const cwp = new THREE.Vector3(); cwp.copy(camera.position); watersurf.worldToLocal(cwp);
const bwp = new THREE.Vector3(); bwp.copy(buoyGroup.position); watersurf.worldToLocal(bwp);
const buoySpinQuat = new THREE.Quaternion();
const csmooth = new THREE.Vector3(0, 0, 1);
const _norm = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 0, 1);
const _colorScratch = new THREE.Color();

const clock = new THREE.Clock();
const offset = Math.random() * 1000;

let creakingnext = 3.0;

function tick() {
  const dt = clock.getDelta();
  const t = clock.getElapsedTime() + offset;

  // Updates
  uniforms.time.value = t;

  // Wind
  const wx = 2 * Math.cos(t*0.05 + 56.78);
  const wy = 0.1 * Math.sin(t*0.02 + 134.57);

  // Camera loop
  const { h, dx, dy } = getWaveInfo(cwp.x, cwp.y, t);
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, h, 0.1);

  _norm.set(-dx, -dy, 1).normalize();
  _norm.transformDirection(watersurf.matrixWorld);

  csmooth.lerp(_norm, 0.05);
  camera.up.copy(csmooth);
  camera.lookAt(0, 0, 0);

  // Buoy loop
  buoyGroup.visible = buoyenabled;
  const { h: bh, dx: bdx, dy: bdy } = getWaveInfo(bwp.x, bwp.y, t);
  buoyGroup.position.z = THREE.MathUtils.lerp(buoyGroup.position.z, bh - 0.24, 0.05);
  _norm.set(-bdx + 0.2*Math.sin(t), -bdy, 1).normalize();
  _norm.transformDirection(watersurf.matrixWorld);
  _quat.setFromUnitVectors(_up, _norm);
  buoySpinQuat.setFromAxisAngle(_up, 2*Math.sin(0.05*t));
  _quat.multiply(buoySpinQuat);
  buoyGroup.quaternion.slerp(_quat, 0.1);

  buoyLight.intensity = 0.15 + 0.15*Math.sin(2*t);
  buoyLightObj.material.emissiveIntensity = 1.5 + 1.5*Math.sin(2*t);
  
  // Rain loop
  rain.visible = rainenabled;
  if (rainenabled) {
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
  }

  // Fog
  scene.fog.density = 0.1 + 0.08 * Math.sin(0.1 * t);

  // Lightning
  if (thunderenabled) { lightning.next -= dt; } else { lightning.active = false; };

  if (lightning.next <= 0) {
    lightning.active = true;
    lightning.next = Math.random() * 6.0 + 2.0;
    lightning.duration = Math.random() * 1.5;
    if (audio) playRandomThunder();
  }

  if (lightning.active) {
    lightning.duration -= dt;
    if (lightning.duration <= 0) {
      lightning.active = false;
    } else {
      lightning.intensity = THREE.MathUtils.clamp( lightning.intensity + (0.03 - Math.random() * 0.06), 0, 0.1 ); // Flicker
    }
  }

  if (!lightning.active) {
    lightning.intensity = THREE.MathUtils.lerp(lightning.intensity, 0, 1 - Math.exp(-5 * dt));
  }

  light.intensity = 1.0 + lightning.intensity * 10.0;

  _colorScratch.lerpColors(lightning.baseColor, lightning.flashColor, lightning.intensity);
  
  scene.fog.color.copy(_colorScratch);
  scene.background.copy(_colorScratch);

  // Creaking
  creakingnext -= dt;
  if (creakingnext < 0 && audio) {
    creakingnext = Math.random() * 7 + 3.0;
    playRandomCreaking(Math.random() * 0.2 + 0.8);
  }

  if (postprocessingenabled) {
    bokehPass.enabled = true;
    bokehPass.uniforms['focus'].value = 10.0 + 2*Math.sin(t);
    bloomPass.enabled = true;
    vignettePass.enabled = true;
  } else {
    bokehPass.enabled = false;
    bloomPass.enabled = false;
    vignettePass.enabled = false;
  }

  composer.render();
  requestAnimationFrame(tick);
}

tick();
