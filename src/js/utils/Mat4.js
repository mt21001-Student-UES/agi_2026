/**
 * Mat4 — Clase de utilidad para matrices de 4x4
 * ===============================================
 * Representa una matriz de 4x4 para transformaciones 3D usando coordenadas homogéneas.
 * Los datos se almacenan en un array plano de 16 elementos en orden row-major (por filas):
 *   [ m00, m01, m02, m03,
 *     m10, m11, m12, m13,
 *     m20, m21, m22, m23,
 *     m30, m31, m32, m33 ]
 *
 * Para pasar la matriz a WebGL (gl.uniformMatrix4fv) se necesita orden column-major.
 * Usar el método `aColumnMajor()` para obtener ese formato.
 */
export default class Mat4 {
  constructor(valores) {
    this.elementos = valores ? new Float32Array(valores) : Mat4.identidad();
  }

  static identidad() {
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }

  static traslacion(tx, ty, tz) {
    return new Mat4([1, 0, 0, tx, 0, 1, 0, ty, 0, 0, 1, tz, 0, 0, 0, 1]);
  }

  static escalado(sx, sy, sz) {
    return new Mat4([sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1]);
  }

  static rotacionX(anguloRad) {
    const c = Math.cos(anguloRad);
    const s = Math.sin(anguloRad);
    return new Mat4([1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1]);
  }

  static rotacionY(anguloRad) {
    const c = Math.cos(anguloRad);
    const s = Math.sin(anguloRad);
    return new Mat4([c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1]);
  }

  static rotacionZ(anguloRad) {
    const c = Math.cos(anguloRad);
    const s = Math.sin(anguloRad);
    return new Mat4([c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }

  // Proyección en perspectiva simple
  static perspectiva(fovRad, aspect, near, far) {
    const f = 1.0 / Math.tan(fovRad / 2);
    const nf = 1 / (near - far);
    return new Mat4([
      f / aspect,
      0,
      0,
      0,
      0,
      f,
      0,
      0,
      0,
      0,
      (far + near) * nf,
      2 * far * near * nf,
      0,
      0,
      -1,
      0,
    ]);
  }

  /**
   * Proyección ortográfica de píxeles a NDC [-1, 1].
   * Equivalente a Mat3.proyeccionNDC pero en 4x4.
   * Mapea X: [0, ancho] → [-1, 1], Y: [0, alto] → [1, -1], Z: [-1, 1] → [-1, 1]
   * 
   * @param {number} ancho  Ancho del canvas en píxeles
   * @param {number} alto   Alto del canvas en píxeles
   * @returns {Mat4}
   */
  static proyeccionNDC(ancho, alto) {
    return new Mat4([
      2 / ancho,  0,          0,      -1,
      0,          -2 / alto,  0,       1,
      0,          0,          0.001,   0, // Escala Z reducida para que los puntos 3D no se salgan del NDC (clipping)
      0,          0,          0,       1,
    ]);
  }

  multiplicar(b) {
    const a = this.elementos;
    const c = b.elementos;
    const out = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        out[i * 4 + j] =
          a[i * 4 + 0] * c[0 * 4 + j] +
          a[i * 4 + 1] * c[1 * 4 + j] +
          a[i * 4 + 2] * c[2 * 4 + j] +
          a[i * 4 + 3] * c[3 * 4 + j];
      }
    }
    return new Mat4(out);
  }

  /**
   * Aplica la matriz a un punto 3D (x, y, z) con coordenada homogénea w=1.
   * Devuelve [x', y', z'] divididos por w (división de perspectiva).
   * 
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {number[]} [x', y', z']
   */
  transformarPunto3D(x, y, z) {
    const e = this.elementos;
    const w = e[12] * x + e[13] * y + e[14] * z + e[15];
    const invW = w !== 0 ? 1 / w : 1;
    return [
      (e[0] * x + e[1] * y + e[2] * z + e[3]) * invW,
      (e[4] * x + e[5] * y + e[6] * z + e[7]) * invW,
      (e[8] * x + e[9] * y + e[10] * z + e[11]) * invW,
    ];
  }

  /**
   * Convierte la matriz de row-major a column-major (formato que espera WebGL).
   * Necesario para `gl.uniformMatrix4fv(loc, false, mat4.aColumnMajor())`.
   * 
   * @returns {Float32Array} Matriz en column-major order (16 floats)
   */
  aColumnMajor() {
    const e = this.elementos;
    return new Float32Array([
      e[0], e[4], e[8],  e[12],
      e[1], e[5], e[9],  e[13],
      e[2], e[6], e[10], e[14],
      e[3], e[7], e[11], e[15],
    ]);
  }
}
