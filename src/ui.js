// On Load
window.addEventListener("load", () => {
  document.querySelectorAll('.label').forEach(p => {
    p.classList.add("loaded");
  })
});

// Audio
let audio = false;
const rainAudio = new Audio("../assets/rain.mp3");
const wavesAudio = new Audio("../assets/waves.mp3");
const thunderAudio = [
  new Audio("../assets/thunder1.mp3"),
  new Audio("../assets/thunder2.mp3"),
  new Audio("../assets/thunder3.mp3"),
  new Audio("../assets/thunder4.mp3") ];
const creakingAudio = [
  new Audio("../assets/creaking1.mp3"),
  new Audio("../assets/creaking2.mp3") ];

rainAudio.loop = true; wavesAudio.loop = true;
rainAudio.volume = 0.5; wavesAudio.volume = 0.5;

export { audio, thunderAudio, creakingAudio };

// Settings
let showsettings = false;
export const switches = { post: true, rain: true, thunder: true, buoy: true, tilt: true, fog: true, };

function bindToggle(id, key) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("change", (e) => {
    switches[key] = e.target.checked;
  });
}

bindToggle("s-post", "post");
bindToggle("s-rain", "rain");
bindToggle("s-thun", "thunder");
bindToggle("s-buoy", "buoy");
bindToggle("s-camera", "tilt");
bindToggle("s-fog", "fog");


// Event listeners
const infoBtn = document.getElementById('info-btn');
const infoClose = document.querySelector('.infomodal-close');
const infomodal = document.querySelector('.infomodal');
const settingsBtn = document.getElementById('settings-btn');
const settingsdialog = document.querySelector('.settingsdialog');
const audioIcon = document.getElementById("audio-icon");
const audioBtn = document.getElementById("audio-btn");

audioBtn?.addEventListener("click", async () => {
  audio = !audio;
  if (audio) {
    try {
      await rainAudio.play();
      await wavesAudio.play();
      audioIcon.classList.remove("fa-volume-xmark");
      audioIcon.classList.add("fa-volume-high");
      audioBtn.setAttribute("aria-pressed", "true");
    } catch (err) { audio = false; }
  } else {
    rainAudio.pause();
    wavesAudio.pause();
    thunderAudio.forEach(t => { t.pause(); });
    creakingAudio.forEach(c => { c.pause(); });
    audioIcon.classList.remove("fa-volume-high");
    audioIcon.classList.add("fa-volume-xmark");
    audioBtn.setAttribute("aria-pressed", "false");
  }
});

infoBtn?.addEventListener("click", () => { infomodal.showModal(); });
infoClose?.addEventListener("click", () => { infomodal.close(); });
settingsBtn?.addEventListener("click", () => {
  if (showsettings) {
    settingsdialog.close();
  } else {
    settingsdialog.show();
  }
  showsettings = !showsettings;
});

function attachDrag(el, handler) {
  el.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    handler(event);
    const move = (e) => { e.preventDefault(); handler(e); };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  });
}

// Helpers
function clamp01(v) { return Math.min(1, Math.max(0, v)); }

function hexToRgb(hex) {
  const parsed = hex.replace("#", "");
  const bigint = parseInt(parsed, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsv(r, g, b) {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rNorm) { h = 60 * (((gNorm - bNorm) / delta) % 6); }
    else if (max === gNorm) { h = 60 * ((bNorm - rNorm) / delta + 2); }
    else { h = 60 * ((rNorm - gNorm) / delta + 4); }
  }
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return { h, s, v };
}

function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;

  let r1 = 0; let g1 = 0; let b1 = 0;
  if (h >= 0 && h < 60) { r1 = c; g1 = x; b1 = 0; }
  else if (h >= 60 && h < 120) { r1 = x; g1 = c; b1 = 0; }
  else if (h >= 120 && h < 180) { r1 = 0; g1 = c; b1 = x; }
  else if (h >= 180 && h < 240) { r1 = 0; g1 = x; b1 = c; }
  else if (h >= 240 && h < 300) { r1 = x; g1 = 0; b1 = c; }
  else { r1 = c; g1 = 0; b1 = x; }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255)
  };
}

function hsvToHex(h, s, v) {
  return rgbToHex(hsvToRgb(h, s, v));
}

function hexToHsv(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsv(r, g, b);
}

function valueToDeg(value, min, max) {
  return 360 * clamp01((value - min) / (max - min));
}

function degToValue(deg, min, max) {
  return min + (deg / 360) * (max - min);
}

// Color Pickers
function createColorPicker(prefix, defaultHex, eventName) {
  const valueEl = document.getElementById(`${prefix}-value`);
  const previewEl = document.getElementById(`${prefix}-preview`);
  const satEl = document.getElementById(`${prefix}-sat`);
  const satPointerEl = document.getElementById(`${prefix}-sat-pointer`);
  const hueEl = document.getElementById(`${prefix}-hue`);
  const huePointerEl = document.getElementById(`${prefix}-hue-pointer`);

  if (!valueEl || !previewEl || !hueEl || !huePointerEl) return;

  const state = hexToHsv(defaultHex);

  const render = (skip = false) => {
    const hex = hsvToHex(state.h, state.s, state.v);
    valueEl.textContent = hex;
    previewEl.style.background = hex;
    huePointerEl.style.left = `${(state.h / 360) * 100}%`;

    if (satPointerEl) {
      satEl.style.backgroundColor = `hsl(${state.h}deg 100% 50%)`;
      satPointerEl.style.left = `${state.s * 100}%`;
      satPointerEl.style.top = `${(1 - state.v) * 100}%`;
    }

    if (!skip) {
      document.dispatchEvent(new CustomEvent(eventName, { detail: hex }));
    }
  };

  if (satEl) {
    attachDrag(satEl, (event) => {
      const rect = satEl.getBoundingClientRect();
      const x = clamp01((event.clientX - rect.left) / rect.width);
      const y = clamp01((event.clientY - rect.top) / rect.height);
      state.s = x;
      state.v = 1 - y;
      render();
    });
  }

  attachDrag(hueEl, (event) => {
    const rect = hueEl.getBoundingClientRect();
    const x = clamp01((event.clientX - rect.left) / rect.width);
    state.h = (x * 360) % 360;
    render();
  });

  render(true);
}

createColorPicker("tint", "#555a5f", "tintcolor-change");
createColorPicker("water", "#37414a", "watercolor-change");
createColorPicker("buoy", "#ff8f80", "buoycolor-change");

// Wave Controls
export const waveuniforms = {
  amp1: 0.6,  freq1: 0.5,  speed1: 0.25,
  amp2: 0.5,  freq2: 0.5,  speed2: 0.2,
  amp3: 0.12,  freq3: 1.0,  speed3: 0.2,
  amp4: 0.12,  freq4: 0.8,  speed4: 0.4,
};

function createKnob(prefix, defaultVal, min, max) {
  const knobEl = document.getElementById(`${prefix}-knob`);
  const valEl = document.getElementById(`${prefix}-val`);

  if (!knobEl || !valEl) return;

  let value = defaultVal;
  let deg = valueToDeg(value, min, max);

  const render = (skip = false) => {
    knobEl.style.transform = `rotate(${deg}deg)`;
    valEl.textContent = value.toFixed(2);
    waveuniforms[prefix] = value;

    if (!skip) {
      document.dispatchEvent(new CustomEvent("waveuniform-change", { detail: {key: prefix, value} }));
    }
  };

  attachDrag(knobEl, (event) => {
    const r = knobEl.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    const dx = event.clientX - cx;
    const dy = event.clientY - cy;

    deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    deg = (deg + 360) % 360;

    value = degToValue(deg, min, max);
    render();
  });

  render(true);
}

const defaults = {
  amp:   [0.6, 0.5, 0.12, 0.12],
  freq:  [0.5, 0.8, 1.0, 0.8],
  speed: [0.25, 0.2, 0.2, 0.4]
};

for (let i = 1; i <= 4; i++) {
  (["amp", "freq", "speed"]).forEach((p) => {
    createKnob(`${p}${i}`, defaults[p][i - 1], 0.0, 3.0);
  });
}

const canvas = document.getElementById('waveCanvas');
const ctx = canvas.getContext('2d');

let phases = [0, 0, 0, 0];

function animateWave() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const waves = [
    { amp: waveuniforms.amp1, freq: waveuniforms.freq1, speed: waveuniforms.speed1, color: "#aa6262" },
    { amp: waveuniforms.amp2, freq: waveuniforms.freq2, speed: waveuniforms.speed2, color: "#6786ad" },
    { amp: waveuniforms.amp3, freq: waveuniforms.freq3, speed: waveuniforms.speed3, color: "#5da088" },
    { amp: waveuniforms.amp4, freq: waveuniforms.freq4, speed: waveuniforms.speed4, color: "#ae9860" },
  ];

  for (let i = 0; i < waves.length; i++) {
    const w = waves[i];

    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const y = w.amp * 20 * Math.sin((x + phases[i]) * w.freq / 25) + canvas.height / 2;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = w.color;
    ctx.stroke();
    phases[i] += w.speed * 2;
  }

  requestAnimationFrame(animateWave);
}

animateWave();