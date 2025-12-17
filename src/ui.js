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
const switches = { post: true, rain: true, thunder: true, buoy: true, tilt: true, fog: true, };
export default switches;

function bindToggle(id, key) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("change", (e) => {
    switches[key] = e.target.checked;
    console.log(switches);
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

// Color pickers
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

function createColorPicker(prefix, defaultHex, eventName) {
  const valueEl = document.getElementById(`${prefix}-value`);
  const previewEl = document.getElementById(`${prefix}-preview`);
  const satEl = document.getElementById(`${prefix}-sat`);
  const satPointerEl = document.getElementById(`${prefix}-sat-pointer`);
  const hueEl = document.getElementById(`${prefix}-hue`);
  const huePointerEl = document.getElementById(`${prefix}-hue-pointer`);

  if (!valueEl || !previewEl || !hueEl || !huePointerEl) return;

  const state = hexToHsv(defaultHex);

  const render = (skipEmit = false) => {
    const hex = hsvToHex(state.h, state.s, state.v);
    valueEl.textContent = hex;
    previewEl.style.background = hex;
    huePointerEl.style.left = `${(state.h / 360) * 100}%`;

    if (satPointerEl) {
      satEl.style.backgroundColor = `hsl(${state.h}deg 100% 50%)`;
      satPointerEl.style.left = `${state.s * 100}%`;
      satPointerEl.style.top = `${(1 - state.v) * 100}%`;
    }

    if (!skipEmit) {
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

const tintDefaultHex = "#555a5f"; const waterDefaultHex = "#141a20"; const buoyDefaultHex = "#ff8f80";
createColorPicker("tint", tintDefaultHex, "tintcolor-change");
createColorPicker("water", waterDefaultHex, "watercolor-change");
createColorPicker("buoy", buoyDefaultHex, "buoycolor-change");