# Thalassophobia

<img width="1440" height="900" alt="thalassophobia" src="https://github.com/user-attachments/assets/aadc7b8e-03f6-4d2d-a456-ce79d1799461" />

In my journey of learning the Three.js library, here is one of my projects. I tried to make it as atmospheric and eerie as possible.
It utilizes a GLSL shader water surface, fog, rain, lightning flashes, a floating buoy, post-processing, and an overlay UI for tuning/messing around.

## Features

- **Procedural water** via custom **GLSL vertex + fragment shaders**
- **Buoy** model imported from Blender + lighting
- **Rain** particle lines with simple wind drift
- **Lightning** events that flash the scene + trigger thunder audio
- **Atmospherics/Post Processing**, including fog, vignette, bloom, and bokeh
- **Settings** to toggle features and adjust the waves

## Specific Technical Uses

- [Three.js](https://threejs.org/)
- Three.js postprocessing: `EffectComposer`, `RenderPass`, `BokehPass`, `UnrealBloomPass`, `VignetteShader`
- Custom GLSL shaders (`watervertex.glsl`, `waterfragment.glsl`)
- OBJ loading (`OBJLoader`)
- Font Awesome icons for UI actions

## Assets & Credits

Audio sources (Pixabay):

* Rain background sound by Franco Gonzalez
* Wave background sound by Mind Mist
* Thunder sounds by DRAGON-STUDIO
* Creaking sounds by DRAGON-STUDIO

(See the in-app about popup for the full attribution links)

### Notes on audio

Browsers block autoplay with sound until the user interacts (click/tap/keypress).
If audio is enabled, you may still need to click once in the page to start playback.
