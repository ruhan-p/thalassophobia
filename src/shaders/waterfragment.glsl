export default `

  uniform vec3 color1;
  uniform vec3 color2;
  varying float vHeight;
  varying vec3  vWorldPos;
  varying vec3  vNormal;
  #include <common>
  #include <fog_pars_fragment>
  #include <lights_pars_begin>

  void main() {
    float h = clamp(vHeight * 2.0 + 0.5, 0.0, 1.0);
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
    gl_FragColor = vec4(finalColor, 1.0);
    #include <fog_fragment>
  }
`;
