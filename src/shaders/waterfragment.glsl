export default `

  varying float vHeight;
  varying vec3  vWorldPos;

  void main() {
    float h = clamp(vHeight * 2.0 + 0.5, 0.0, 1.0);
    vec3 color = mix(vec3(0.0, 0.2, 0.4), vec3(0.0, 0.9, 1.0), h);

    gl_FragColor = vec4(color, 1.0);
  }
`;
