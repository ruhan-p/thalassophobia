export default `
  uniform float time;
  uniform float amp1;
  uniform float amp2;
  uniform float freq1;
  uniform float freq2;
  uniform float speed1;
  uniform float speed2;

  varying vec2 vPos;
  varying vec3 vWorldPos;
  varying float vHeight;
  #include <fog_pars_fragment>

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

  float heightField(vec2 pos) {
    vec2 st1 = vec2(pos.x * freq1 + time * speed1,
                    pos.y * freq1 + time * speed1);
    vec2 st2 = vec2(pos.x * freq2 - time * speed2,
                    pos.y * freq2 - time * speed2);

    float n1 = valueNoise(st1) - 1.0;
    float n2 = valueNoise(st2) - 1.0;

    float h = n1 * amp1 + n2 * amp2;
    h += (valueNoise(st1 * 2.5) - 0.5) * 0.05;
    return h;
  }

  vec3 computeNormal(vec2 pos) {
    // small offset to approximate derivatives
    float eps = 0.04;
    float hL = heightField(pos - vec2(eps, 0.0));
    float hR = heightField(pos + vec2(eps, 0.0));
    float hD = heightField(pos - vec2(0.0, eps));
    float hU = heightField(pos + vec2(0.0, eps));

    vec3 n = normalize(vec3(-(hR - hL) / (2.0 * eps), -(hU - hD) / (2.0 * eps), 1.0));
    return n;
  }

  void main() {
    vec3 normal = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 lightDir = normalize(vec3(0.3, 0.45, 0.85));

    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
    float diffuse = max(dot(normal, lightDir), 0.0);
    float specular = pow(max(dot(reflect(-lightDir, normal), viewDir), 0.0), 48.0);

    float heightMask = clamp(vHeight * 2.0 + 0.5, 0.0, 1.0);

    vec3 deep = vec3(0.02, 0.07, 0.12);
    vec3 shallow = vec3(0.07, 0.25, 0.36);
    vec3 skyRef = vec3(0.14, 0.32, 0.45);
    vec3 foam = vec3(0.6, 0.64, 0.7);

    vec3 waterColor = mix(deep, shallow, heightMask);
    waterColor = mix(waterColor, skyRef, fresnel * 0.55);

    float foamMask = smoothstep(0.18, 0.5, heightMask + fresnel * 0.25);
    vec3 lit = waterColor * (0.4 + diffuse * 0.9) + specular * 0.25;
    vec3 color = mix(lit, foam, foamMask);

    gl_FragColor = vec4(color, 1.0);
    #include <fog_fragment>
  }
`;
