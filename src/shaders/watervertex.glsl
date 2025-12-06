export default `
  uniform float time;

  // Large waves (noise-based)
  uniform float amp1;
  uniform float amp2;
  uniform float freq1;
  uniform float freq2;
  uniform float speed1;
  uniform float speed2;

  // Choppy Gerstner layer
  uniform float amp3;
  uniform float amp4;
  uniform float freq3;
  uniform float freq4;
  uniform float speed3;
  uniform float speed4;
  uniform float steep;

  varying vec2 vPos;
  varying vec3 vWorldPos;
  varying float vHeight;
  varying vec3 vNormal;

  #include <fog_pars_vertex>

  const float TWO_PI = 6.28318530718;

  // -----------------------------
  // Your original 2D value noise
  // -----------------------------
  float rand(vec2 st) {
    return fract(sin(dot(st, vec2(27.619, 57.583))) * 43758.5453123);
  }

  float valueNoise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = rand(i);
    float b = rand(i + vec2(1.0, 0.0));
    float c = rand(i + vec2(0.0, 1.0));
    float d = rand(i + vec2(1.0, 1.0));

    vec2 u = smoothstep(0.0, 1.0, f);

    float x1 = mix(a, b, u.x);
    float x2 = mix(c, d, u.x);
    return mix(x1, x2, u.y);
  }

  // -----------------------------
  // Large wave height layer (ONLY 1 & 2)
  // -----------------------------
  float getLargeHeight(vec2 pos) {
    vec2 st1 = vec2(
      pos.x * freq1 + time * speed1,
      pos.y * freq1 + time * speed1
    );

    vec2 st2 = vec2(
      pos.x * freq2 - time * speed2,
      pos.y * freq2 - time * speed2
    );

    float n1 = valueNoise(st1) - 1.0;
    float n2 = valueNoise(st2) - 1.0;

    return n1 * amp1 + n2 * amp2;
  }

  // -----------------------------
  // Gerstner helpers
  // -----------------------------
  vec2 dirFromAngle(float a) {
    return vec2(cos(a), sin(a));
  }

  vec3 gerstnerWave(
    vec2 pos,
    vec2 dir,
    float amp,
    float freq,
    float speed,
    float steepness,
    float timeSign,
    float phaseOffset
  ) {
    vec2 d = normalize(dir);

    float q = clamp(steepness, 0.0, 1.0);
    float k = max(0.0001, freq * TWO_PI);

    float phase = dot(d, pos) * k + (time * speed * timeSign) + phaseOffset;

    float c = cos(phase);
    float s = sin(phase);

    // Horizontal "chop" scales with steepness * amplitude
    return vec3(
      d.x * (q * amp) * c,
      d.y * (q * amp) * c,
      amp * s
    );
  }

  // -----------------------------
  // Choppy displacement:
  // Use multiple angles + mixed travel directions
  // to avoid a single dominant wave motion axis.
  // -----------------------------
  vec3 getChoppyDisplacement(vec2 pos) {
    vec3 sum = vec3(0.0);

    // Spread angles around the circle
    // (chosen to avoid obvious symmetry)
    float a0 = 0.35;
    float a1 = 1.55;
    float a2 = 2.75;
    float a3 = 3.95;
    float a4 = 5.10;
    float a5 = 6.00; // near wrap but offset from a0

    // Split amplitudes across components
    float a3split = amp3 * 0.34;
    float a4split = amp4 * 0.34;

    // Small, deterministic phase offsets so components don't lock together
    // (no extra uniforms needed)
    float p0 = 1.7;
    float p1 = 4.3;
    float p2 = 2.1;
    float p3 = 5.6;
    float p4 = 3.2;
    float p5 = 0.9;

    // Group using set 3
    sum += gerstnerWave(pos, dirFromAngle(a0), a3split, freq3, speed3, steep,  1.0, p0);
    sum += gerstnerWave(pos, dirFromAngle(a2), a3split, freq3, speed3, steep, -1.0, p2);
    sum += gerstnerWave(pos, dirFromAngle(a4), a3split, freq3, speed3, steep,  1.0, p4);

    // Group using set 4
    sum += gerstnerWave(pos, dirFromAngle(a1), a4split, freq4, speed4, steep, -1.0, p1);
    sum += gerstnerWave(pos, dirFromAngle(a3), a4split, freq4, speed4, steep,  1.0, p3);
    sum += gerstnerWave(pos, dirFromAngle(a5), a4split, freq4, speed4, steep, -1.0, p5);

    return sum;
  }

  // -----------------------------
  // Combined displacement
  // Large vertical noise + extra Gerstner layer (with horizontal chop)
  // -----------------------------
  vec3 getDisplacedPosition(vec3 pos) {
    float largeH = getLargeHeight(pos.xy);

    vec3 p = pos;
    p.z += largeH;

    vec3 chop = getChoppyDisplacement(pos.xy);
    p += chop;

    return p;
  }

  float getTotalHeight(vec2 pos) {
    float largeH = getLargeHeight(pos);
    float chopH = getChoppyDisplacement(pos).z;
    return largeH + chopH;
  }

  void main() {
    vec3 basePos = position;

    vec3 displaced = getDisplacedPosition(basePos);

    // Normals via finite differences on the full displaced surface
    float delta = 0.05;

    vec3 px1 = getDisplacedPosition(vec3(basePos.x + delta, basePos.y, basePos.z));
    vec3 px2 = getDisplacedPosition(vec3(basePos.x - delta, basePos.y, basePos.z));
    vec3 py1 = getDisplacedPosition(vec3(basePos.x, basePos.y + delta, basePos.z));
    vec3 py2 = getDisplacedPosition(vec3(basePos.x, basePos.y - delta, basePos.z));

    vec3 tangent = normalize(px1 - px2);
    vec3 bitangent = normalize(py1 - py2);
    vec3 displacedNormal = normalize(cross(tangent, bitangent));

    vHeight = getTotalHeight(basePos.xy);
    vPos = basePos.xy;
    vWorldPos = (modelMatrix * vec4(displaced, 1.0)).xyz;
    vNormal = normalize(normalMatrix * displacedNormal);

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    #include <fog_vertex>
  }
`;
// export default `
//   uniform float time;
//   uniform float amp1;
//   uniform float amp2;
//   uniform float amp3;
//   uniform float freq1;
//   uniform float freq2;
//   uniform float freq3;
//   uniform float speed1;
//   uniform float speed2;
//   uniform float speed3;

//   varying vec2 vPos;
//   varying vec3 vWorldPos;
//   varying float vHeight;
//   varying vec3 vNormal;
//   #include <fog_pars_vertex>

//   float rand(vec2 st) {
//     return fract(sin(dot(st, vec2(27.619, 57.583))) * 43758.5453123);
//   }

//   float valueNoise(vec2 st) {
//     vec2 i = floor(st);
//     vec2 f = fract(st);

//     float a = rand(i);
//     float b = rand(i + vec2(1.0, 0.0));
//     float c = rand(i + vec2(0.0, 1.0));
//     float d = rand(i + vec2(1.0, 1.0));

//     vec2 u = smoothstep(0.0, 1.0, f);

//     float x1 = mix(a, b, u.x);
//     float x2 = mix(c, d, u.x);
//     return mix(x1, x2, u.y);
//   }

//   float getHeight(vec2 pos) {
//     vec2 st1 = vec2(pos.x * freq1 + time * speed1,
//                     pos.y * freq1 + time * speed1);
//     vec2 st2 = vec2(pos.x * freq2 - time * speed2,
//                     pos.y * freq2 - time * speed2);
//     vec2 st3 = vec2(pos.x * freq3 - time * speed3,
//                     pos.y * freq3 - time * speed3);

//     float n1 = valueNoise(st1) - 1.0;
//     float n2 = valueNoise(st2) - 1.0;
//     float n3 = valueNoise(st3) - 1.0;

//     float height = n1 * amp1 + n2 * amp2 + n3 * amp3;
//     return height;
//   }

//   void main() {
//     vec3 pos = position;

//     float height = getHeight(pos.xy);
//     pos.z += height;

//     float delta = 0.05;
//     float heightX1 = getHeight(pos.xy + vec2(delta, 0.0));
//     float heightX2 = getHeight(pos.xy - vec2(delta, 0.0));
//     float heightY1 = getHeight(pos.xy + vec2(0.0, delta));
//     float heightY2 = getHeight(pos.xy - vec2(0.0, delta));

//     vec3 tangent = normalize(vec3(2.0 * delta, 0.0, heightX1 - heightX2));
//     vec3 bitangent = normalize(vec3(0.0, 2.0 * delta, heightY1 - heightY2));
//     vec3 displacedNormal = normalize(cross(tangent, bitangent));

//     vHeight = height;
//     vPos = position.xy;
//     vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
//     vNormal = normalize(normalMatrix * displacedNormal);

//     vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
//     gl_Position = projectionMatrix * mvPosition;
//     #include <fog_vertex>
//   }
// `;
