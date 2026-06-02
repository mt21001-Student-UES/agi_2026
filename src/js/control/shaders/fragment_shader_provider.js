class FragmentShaderProvider {
  get theFragmentShader() {
    return `
        precision mediump float;
        varying vec3 vColor; // color dinámico desde JS

        void main(void) {
            gl_FragColor = vec4(vColor, 1.0);
        }
        `;
  }

  // Para textura de fondo
  get textureBackgroundShader() {
    return `
        precision mediump float;
        varying vec2 vTexCoord;
        uniform sampler2D uSampler;
  
        void main(void) {
          gl_FragColor = texture2D(uSampler, vTexCoord);
        }
      `;
  }
}
export default FragmentShaderProvider;
