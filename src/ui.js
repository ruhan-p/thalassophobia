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
let postprocessingenabled = true;
let rainenabled = true;
let thunderenabled = true;
let buoyenabled = true;

const postToggle = document.getElementById('s-post');
const rainToggle = document.getElementById('s-rain');
const thunderToggle = document.getElementById('s-thun');
const buoyToggle = document.getElementById('s-buoy');
postToggle.addEventListener('change', (e) => { postprocessingenabled = e.target.checked; });
rainToggle.addEventListener('change', (e) => { rainenabled = e.target.checked; });
thunderToggle.addEventListener('change', (e) => { thunderenabled = e.target.checked; });
buoyToggle.addEventListener('change', (e) => { buoyenabled = e.target.checked; });
export { postprocessingenabled, rainenabled, thunderenabled, buoyenabled };

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
