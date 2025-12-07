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
    float h = clamp(vHeight + 1.0, 0.0, 1.0);
    vec3 baseColor = mix(color1, color2, h);

    vec3 normal = normalize(vNormal);
    // Small ripples perturb the shading normal so lighting catches more motion.
    vec2 rippleUV = vWorldPos.xy * 0.1 + vec2(time * 0.35, time * 0.25);
    float ripple = valueNoise(rippleUV);
    vec3 rippleNormal = normalize(vec3(dFdx(ripple), dFdy(ripple), 0.35));
    normal = normalize(mix(normal, rippleNormal, 0.35));

    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
    float absorption = exp(-abs(vHeight) * 0.8);
    vec3 bodyColor = mix(color2, baseColor, absorption);

    vec3 lighting = ambientLightColor;
    vec3 specular = vec3(0.0);

    #if NUM_DIR_LIGHTS > 0
    for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
      vec3 dir = directionalLights[i].direction;
      vec3 lcolor = directionalLights[i].color;
      float diffuseFactor = max(dot(normal, dir), 0.0);
      lighting += lcolor * diffuseFactor;

      vec3 halfDir = normalize(dir + viewDir);
      float spec = pow(max(dot(normal, halfDir), 0.0), 96.0);
      specular += lcolor * spec * 10.0;
    }
    #endif

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

      vec3 halfDir = normalize(lightDir + viewDir);
      float spec = pow(max(dot(normal, halfDir), 0.0), 72.0);
      specular += pointLights[i].color * spec * attenuation * 0.6;
    }
    #endif

    vec3 lit = bodyColor * lighting;

    // Simple sky reflection driven by the view angle.
    float up = clamp(normal.z * 0.5 + 0.5, 0.0, 1.0);
    vec3 reflection = mix(fogColor, vec3(0.58, 0.68, 0.78), up) * fresnel;
    vec3 finalColor = lit + reflection + specular;

    // Screen-space slope change helps catch interfering waves, while raw slope
    // captures big crests. Both feed the foam mask.
    float slopeFoam = smoothstep(0.05, 0.15, vSlope);

    // Make collision foam cover more area and contribute more.
    float collisionRaw = fwidth(vSlope) * 4.0;
    float collisionFoam = smoothstep(0.0, 0.08, collisionRaw); // lower start, higher end
    collisionFoam = pow(collisionFoam, 0.6); // flatter curve = thicker bands

    float collisionComponent = collisionFoam * 1.25;
    // High-frequency breakup so not every collision produces foam.
    vec2 foamUV_base = vWorldPos.xy * 3.0 + vec2(time * 0.08, time * 0.06);
    float base = valueNoise(foamUV_base);

    // Detail noise shapes the patch edges (controls patch size/granularity)
    vec2 foamUV_detail = vWorldPos.xy * 4.0 + vec2(time * 0.2, time * 0.16);
    float detail = valueNoise(foamUV_detail);

    // Gate by base, then erode with detail
    float foamMask = smoothstep(0.55, 0.7, base) * smoothstep(0.4, 0.8, detail);
    collisionComponent *= foamMask;

    float foam = clamp(slopeFoam + collisionComponent, 0.0, 1.0);
    foam = smoothstep(0.08, 0.75, foam); // relax final squeeze


    vec3 foamed = mix(finalColor, vec3(1.0), foam); 
    gl_FragColor = vec4(foamed, 1.0);
    #include <fog_fragment>
  }
`;
