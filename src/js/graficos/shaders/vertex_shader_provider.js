class VertexShaderProvider {
  constructor() {}

  get threePointShader() {
    return `
      attribute vec3 coordenadas;
      attribute vec3 color;
      uniform float uPointSize;
      
      varying vec3 vColor;

      void main(void) {
          gl_PointSize = uPointSize; // tamaño dinámico desde JS
          gl_Position = vec4(coordenadas, 1.0); // coordenadas homogéneas
          vColor = color;
      }
      `;
  }
  
  // Para quad con textura de fondo
  get textureBackgroundShader() {
    return `
      attribute vec3 coordenadas;
      attribute vec2 aTexCoord;
      varying vec2 vTexCoord;

      void main(void) {
        gl_Position = vec4(coordenadas, 1.0);
        vTexCoord = aTexCoord;
      }
    `;
  }
}

export default VertexShaderProvider;
