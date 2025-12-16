// On Load
window.addEventListener("load", () => {
  document.querySelectorAll('.label').forEach(p => {
    p.classList.add("loaded");
  })
});

// Audio
let audio = false;
const rainAudio = new Audio("../assets/rain.mp3"); // Sound Effect by <a href="https://pixabay.com/users/donrain-26735743/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=110792">Franco Gonzalez</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=110792">Pixabay</a>
const wavesAudio = new Audio("../assets/waves.mp3"); // Sound Effect by <a href="https://pixabay.com/users/mindmist-48855701/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=313367">Mind Mist</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=313367">Pixabay</a>
const thunderAudio = [
  new Audio("../assets/thunder1.mp3"),
  new Audio("../assets/thunder2.mp3"),
  new Audio("../assets/thunder3.mp3"),
  new Audio("../assets/thunder4.mp3") ]; // Sound Effect by <a href="https://pixabay.com/users/dragon-studio-38165424/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=364468">DRAGON-STUDIO</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=364468">Pixabay</a>
const creakingAudio = [
  new Audio("../assets/creaking1.mp3"),
  new Audio("../assets/creaking2.mp3") ]; // Sound Effect by <a href="https://pixabay.com/users/dragon-studio-38165424/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=401724">DRAGON-STUDIO</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=401724">Pixabay</a>

rainAudio.loop = true; wavesAudio.loop = true;
rainAudio.volume = 0.5; wavesAudio.volume = 0.5;

export { audio, thunderAudio, creakingAudio };

// Event listeners
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