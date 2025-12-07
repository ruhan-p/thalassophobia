export default `
  uniform float time;

  // Big swells (mapped from your existing uniforms)
  uniform float amp1;
  uniform float amp2;
  uniform float freq1;
  uniform float freq2;
  uniform float speed1;
  uniform float speed2;

  // Small choppy details (mapped from your existing uniforms)
  uniform float amp3;
  uniform float amp4;
  uniform float freq3;
  uniform float freq4;
  uniform float speed3;
  uniform float speed4;

  // Used here as an extra "chop intensity" multiplier
  uniform float steep;

  // NEW: number of small-wave noise iterations (1..10)
  uniform float smallIterations;

  varying vec2 vPos;
  varying vec3 vWorldPos;
  varying float vHeight;
  varying vec3 vNormal;
  varying float vSlope;

  #include <fog_pars_vertex>

  // ---------------------------------------------
  // Classic Perlin 3D Noise (Stefan Gustavson)
  // ---------------------------------------------
  vec4 permute(vec4 x) {
      return mod(((x * 34.0) + 1.0) * x, 289.0);
  }

  vec4 taylorInvSqrt(vec4 r) {
      return 1.79284291400159 - 0.85373472095314 * r;
  }

  vec3 fade(vec3 t) {
      return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  }

  float cnoise(vec3 P) {
      vec3 Pi0 = floor(P);
      vec3 Pi1 = Pi0 + vec3(1.0);
      Pi0 = mod(Pi0, 289.0);
      Pi1 = mod(Pi1, 289.0);
      vec3 Pf0 = fract(P);
      vec3 Pf1 = Pf0 - vec3(1.0);

      vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
      vec4 iy = vec4(Pi0.yy, Pi1.yy);
      vec4 iz0 = Pi0.zzzz;
      vec4 iz1 = Pi1.zzzz;

      vec4 ixy  = permute(permute(ix) + iy);
      vec4 ixy0 = permute(ixy + iz0);
      vec4 ixy1 = permute(ixy + iz1);

      vec4 gx0 = ixy0 / 7.0;
      vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
      gx0 = fract(gx0);
      vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
      vec4 sz0 = step(gz0, vec4(0.0));
      gx0 -= sz0 * (step(0.0, gx0) - 0.5);
      gy0 -= sz0 * (step(0.0, gy0) - 0.5);

      vec4 gx1 = ixy1 / 7.0;
      vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
      gx1 = fract(gx1);
      vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
      vec4 sz1 = step(gz1, vec4(0.0));
      gx1 -= sz1 * (step(0.0, gx1) - 0.5);
      gy1 -= sz1 * (step(0.0, gy1) - 0.5);

      vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
      vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
      vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
      vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
      vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
      vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
      vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
      vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

      vec4 norm0 = taylorInvSqrt(vec4(
          dot(g000, g000), dot(g010, g010),
          dot(g100, g100), dot(g110, g110)
      ));
      g000 *= norm0.x;
      g010 *= norm0.y;
      g100 *= norm0.z;
      g110 *= norm0.w;

      vec4 norm1 = taylorInvSqrt(vec4(
          dot(g001, g001), dot(g011, g011),
          dot(g101, g101), dot(g111, g111)
      ));
      g001 *= norm1.x;
      g011 *= norm1.y;
      g101 *= norm1.z;
      g111 *= norm1.w;

      float n000 = dot(g000, Pf0);
      float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
      float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
      float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
      float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
      float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
      float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
      float n111 = dot(g111, Pf1);

      vec3 fade_xyz = fade(Pf0);
      vec4 n_z = mix(
          vec4(n000, n100, n010, n110),
          vec4(n001, n101, n011, n111),
          fade_xyz.z
      );
      vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
      float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);

      return 2.2 * n_xyz;
  }

  // ---------------------------------------------
  // Big swells
  // "Raging sea" big-wave core, but using your 1 & 2 sets
  // ---------------------------------------------
  float getBigWave(vec2 p) {
      float w1 =
          sin(p.x * freq1 + time * speed1) *
          sin(p.y * freq1 + time * speed1) *
          amp1;

      float w2 =
          sin(p.x * freq2 - time * speed2) *
          sin(p.y * freq2 - time * speed2) *
          amp2;

      return w1 + w2;
  }

  // ---------------------------------------------
  // Small choppy details
  // Multi-iteration Perlin chop using your 3 & 4 sets
  // ---------------------------------------------
  float getSmallWave(vec2 p) {
      float small = 0.0;
      float iters = clamp(smallIterations, 1.0, 10.0);

      for (float i = 1.0; i <= 10.0; i++) {
          if (i > iters) break;

          float n3 = cnoise(vec3(
              p * freq3 * i,
              time * speed3
          ));

          float n4 = cnoise(vec3(
              p * freq4 * i,
              time * speed4
          ));

          small -= abs(n3) * (amp3 / i);
          small -= abs(n4) * (amp4 / i);
      }

      // "steep" here acts as extra storm-chop intensity
      float s = clamp(steep, 0.0, 3.0);
      small *= mix(1.0, 1.35, clamp(s / 2.5, 0.0, 1.0));

      return small;
  }

  float getHeight(vec2 p) {
      return getBigWave(p) + getSmallWave(p);
  }

  void main() {
      vec3 pos = position;

      float height = getHeight(pos.xy);
      pos.z += height;

      // Normal from finite differences on combined height.
      // Use forward differences to cut expensive height evaluations
      // (important when smallIterations is high).
      float delta = 0.05;
      float hX = getHeight(pos.xy + vec2(delta, 0.0)) - height;
      float hY = getHeight(pos.xy + vec2(0.0, delta)) - height;

      vec3 tangent = normalize(vec3(delta, 0.0, hX));
      vec3 bitangent = normalize(vec3(0.0, delta, hY));
      vec3 displacedNormal = normalize(cross(tangent, bitangent));

      // Store slope magnitude for foam/crest detection in fragment shader.
      vSlope = length(vec2(hX, hY));
      vHeight = height;
      vPos = position.xy;
      vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
      vNormal = normalize(normalMatrix * displacedNormal);

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
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
