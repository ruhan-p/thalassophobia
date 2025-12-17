export default `

  uniform vec3 color1;
  uniform vec3 color2;
  uniform float time;

  varying float vHeight;
  varying vec3  vWorldPos;
  varying vec3  vNormal;
  varying float vSlope;

  #include <common>
  #include <fog_pars_fragment>
  #include <lights_pars_begin>
  #include <packing>

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  void main() {

    // Color
    vec3 normal = normalize(vNormal);
    vec3 lighting = ambientLightColor;

    // Lighting
    #if NUM_POINT_LIGHTS > 0
    for (int i = 0; i < NUM_POINT_LIGHTS; i++) {
      vec3 lightDir = pointLights[i].position - vWorldPos;
      float distanceToLight = length(lightDir);
      lightDir = lightDir / max(distanceToLight, 0.0001);

      float diffuseFactor = max(dot(normal, lightDir), 0.0);
      float attenuation = 1.0;
      if (pointLights[i].distance > 0.0) {
        attenuation = pow(clamp(1.0 - distanceToLight / pointLights[i].distance, 0.0, 1.0), 2.0);
      }

      lighting += pointLights[i].color * diffuseFactor * attenuation;
    }
    #endif

    float h = clamp(vHeight + 0.75, 0.0, 1.0);
    vec3 color = mix(color1, color2, h);

    vec3 finalColor = color * lighting;

    // Foam
    float collisionRaw = fwidth(vSlope) * 4.0;
    float collisionFoam = smoothstep(0.0, 0.08, collisionRaw);
    collisionFoam = pow(collisionFoam, 0.6);

    float collisionComponent = collisionFoam * 1.25;
    
    vec2 foamUV_base = vWorldPos.xy * 1.0 + vec2(time * 0.08, time * 0.06);
    float base = valueNoise(foamUV_base);

    vec2 foamUV_detail = vWorldPos.xy * 4.0 + vec2(time * 0.2, time * 0.16);
    float detail = valueNoise(foamUV_detail);

    float foamMask = smoothstep(0.55, 0.7, base) * smoothstep(0.4, 0.8, detail);
    collisionComponent *= foamMask;

    float foam = clamp(collisionComponent, 0.0, 1.0);
    foam = smoothstep(0.08, 0.75, foam);

    // Mixing
    vec3 foamed = mix(finalColor, vec3(0.5,0.55,0.60), foam);

    gl_FragColor = vec4(foamed, 0.95);
    
    #include <fog_fragment>
  }
`;