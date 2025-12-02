export default `
  varying float vHeight;
  #include <fog_pars_fragment>
  void main() {
      gl_FragColor = vec4(vec3(1.0), 1.0);
      #include <fog_fragment>
  }
`;