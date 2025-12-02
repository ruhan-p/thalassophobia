  export default `
  uniform float time;
  uniform float amp1;
  uniform float amp2;
  uniform float freq1;
  uniform float freq2;
  uniform float speed1;
  uniform float speed2;

  varying float vHeight;

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

  void main() {
    vec3 pos = position;

    vec2 st1 = vec2(pos.x * freq1 + time * speed1,
                    pos.y * freq1 + time * speed1);
    vec2 st2 = vec2(pos.x * freq2 - time * speed2,
                    pos.y * freq2 - time * speed2);

    float n1 = valueNoise(st1) - 1.0;
    float n2 = valueNoise(st2) - 1.0;

    float height = n1 * amp1 + n2 * amp2;
    pos.z += height;

    vHeight = height;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
  `;