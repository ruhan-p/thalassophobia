export default `

  uniform vec3 color1;
  uniform vec3 color2;
  varying float vHeight;
  varying vec3  vWorldPos;
  varying vec3  vNormal;
  varying float vSlope;
  #include <common>
  #include <fog_pars_fragment>
  #include <lights_pars_begin>

  void main() {
    float h = clamp(vHeight + 1.0, 0.0, 1.0);
    vec3 color = mix(color1, color2, h);

    vec3 normal = normalize(vNormal);
    vec3 lighting = ambientLightColor;

    #if NUM_DIR_LIGHTS > 0
    for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
      vec3 dir = directionalLights[i].direction;
      vec3 lcolor = directionalLights[i].color;
      float diffuseFactor = max(dot(normal, dir), 0.0);
      lighting += lcolor * diffuseFactor;
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
    }
    #endif

    vec3 finalColor = color * lighting;
    // Screen-space slope change helps catch interfering waves, while raw slope
    // captures big crests. Both feed the foam mask.
    float slopeFoam = smoothstep(0.2, 0.8, vSlope);

    // Make collision foam cover more area and contribute more.
    float collisionRaw = fwidth(vSlope) * 4.0;
    float collisionFoam = smoothstep(0.0, 0.08, collisionRaw); // lower start, higher end
    collisionFoam = pow(collisionFoam, 0.6); // flatter curve = thicker bands

    float foam = clamp(slopeFoam + collisionFoam * 1.25, 0.0, 1.0);
    foam = smoothstep(0.08, 0.75, foam); // relax final squeeze


    vec3 foamed = mix(finalColor, vec3(1.0), foam); 
    gl_FragColor = vec4(foamed, 1.0);
    #include <fog_fragment>
  }
`;
