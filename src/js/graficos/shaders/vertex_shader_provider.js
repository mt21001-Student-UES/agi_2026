class VertexShaderProvider {
  constructor() {}

  get threePointShader() {
    return `
      attribute vec3 coordenadas;   // x, y, z
      attribute vec3 color;         // r, g, b
      uniform float uPointSize;
      
      varying vec3 vColor;

      void main(void) {
          gl_PointSize = uPointSize; // tamaño dinámico desde JS
          gl_Position = vec4(coordenadas, 1.0); // coordenadas homogéneas
          vColor = color;
      }
      `;
  }

  get threeDShader() {
    return `
      attribute vec3 coordenadas;   // x, y, z
      attribute vec3 color;         // r, g, b
      uniform float uPointSize;
      uniform mat4 uMatrix;         // ahora 4x4
      
      varying vec3 vColor;

      void main(void) {
          gl_PointSize = uPointSize; // tamaño dinámico desde JS
          // Multiplicamos por la matriz 4x4
          gl_Position = uMatrix * vec4(coordenadas, 1.0);
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
