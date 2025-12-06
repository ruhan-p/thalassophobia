export default `
  uniform float time;
  uniform float amp1;
  uniform float amp2;
  uniform float amp3;
  uniform float freq1;
  uniform float freq2;
  uniform float freq3;
  uniform float speed1;
  uniform float speed2;
  uniform float speed3;

  varying vec2 vPos;
  varying vec3 vWorldPos;
  varying float vHeight;
  varying vec3 vNormal;
  #include <fog_pars_vertex>

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

  float getHeight(vec2 pos) {
    vec2 st1 = vec2(pos.x * freq1 + time * speed1,
                    pos.y * freq1 + time * speed1);
    vec2 st2 = vec2(pos.x * freq2 - time * speed2,
                    pos.y * freq2 - time * speed2);
    vec2 st3 = vec2(pos.x * freq3 - time * speed3,
                    pos.y * freq3 - time * speed3);

    float n1 = valueNoise(st1) - 1.0;
    float n2 = valueNoise(st2) - 1.0;
    float n3 = valueNoise(st3) - 1.0;

    float height = n1 * amp1 + n2 * amp2 + n3 * amp3;
    return height;
  }

  void main() {
    vec3 pos = position;

    float height = getHeight(pos.xy);
    pos.z += height;

    float delta = 0.05;
    float heightX1 = getHeight(pos.xy + vec2(delta, 0.0));
    float heightX2 = getHeight(pos.xy - vec2(delta, 0.0));
    float heightY1 = getHeight(pos.xy + vec2(0.0, delta));
    float heightY2 = getHeight(pos.xy - vec2(0.0, delta));

    vec3 tangent = normalize(vec3(2.0 * delta, 0.0, heightX1 - heightX2));
    vec3 bitangent = normalize(vec3(0.0, 2.0 * delta, heightY1 - heightY2));
    vec3 displacedNormal = normalize(cross(tangent, bitangent));

    vHeight = height;
    vPos = position.xy;
    vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    vNormal = normalize(normalMatrix * displacedNormal);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;
