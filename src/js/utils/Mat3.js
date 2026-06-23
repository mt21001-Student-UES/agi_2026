/**
 * Mat3 — Clase de utilidad para matrices de 3x3
 * ============================================
 * Representa una matriz de 3x3 para transformaciones en 2D usando coordenadas homogéneas.
 * Los datos se almacenan en un array plano de 9 elementos en orden row-major (por filas):
 *   [ m00, m01, m02,
 *     m10, m11, m12,
 *     m20, m21, m22 ]
 */
export default class Mat3 {
  /**
   * @param {number[]} [valores] Array opcional de 9 elementos para inicializar la matriz.
   */
  constructor(valores) {
    this.elementos = valores ? new Float32Array(valores) : Mat3.crearIdentidad();
  }

  /**
   * Crea un Float32Array inicializado como la matriz identidad.
   * @returns {Float32Array}
   */
  static crearIdentidad() {
    return new Float32Array([
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ]);
  }

  /**
   * Asigna los valores de la identidad a esta matriz.
   * @returns {this}
   */
  identidad() {
    this.elementos.set([
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ]);
    return this;
  }

  /**
   * Multiplica esta matriz por otra y devuelve una nueva instancia con el resultado (this * B).
   * @param {Mat3} b
   * @returns {Mat3}
   */
  multiplicar(b) {
    const ae = this.elementos;
    const be = b.elementos;
    const out = new Float32Array(9);

    const a00 = ae[0], a01 = ae[1], a02 = ae[2];
    const a10 = ae[3], a11 = ae[4], a12 = ae[5];
    const a20 = ae[6], a21 = ae[7], a22 = ae[8];

    const b00 = be[0], b01 = be[1], b02 = be[2];
    const b10 = be[3], b11 = be[4], b12 = be[5];
    const b20 = be[6], b21 = be[7], b22 = be[8];

    out[0] = a00 * b00 + a01 * b10 + a02 * b20;
    out[1] = a00 * b01 + a01 * b11 + a02 * b21;
    out[2] = a00 * b02 + a01 * b12 + a02 * b22;

    out[3] = a10 * b00 + a11 * b10 + a12 * b20;
    out[4] = a10 * b01 + a11 * b11 + a12 * b21;
    out[5] = a10 * b02 + a11 * b12 + a12 * b22;

    out[6] = a20 * b00 + a21 * b10 + a22 * b20;
    out[7] = a20 * b01 + a21 * b11 + a22 * b21;
    out[8] = a20 * b02 + a21 * b12 + a22 * b22;

    return new Mat3(out);
  }

  /**
   * Genera una matriz de traslación.
   * @param {number} tx
   * @param {number} ty
   * @returns {Mat3}
   */
  static traslacion(tx, ty) {
    return new Mat3([
      1, 0, tx,
      0, 1, ty,
      0, 0, 1
    ]);
  }

  /**
   * Genera una matriz de rotación (alrededor del eje Z).
   * @param {number} anguloRad Ángulo en radianes.
   * @returns {Mat3}
   */
  static rotacion(anguloRad) {
    const c = Math.cos(anguloRad);
    const s = Math.sin(anguloRad);
    return new Mat3([
      c, -s, 0,
      s,  c, 0,
      0,  0, 1
    ]);
  }

  /**
   * Genera una matriz afín 2D que simula la proyección ortográfica 
   * de una rotación en 3D (X, Y, Z) aplicada al plano XY.
   * @param {number} rotX Radianes
   * @param {number} rotY Radianes
   * @param {number} rotZ Radianes
   * @returns {Mat3}
   */
  static rotacion3D(rotX, rotY, rotZ) {
    const cx = Math.cos(rotX), sx = Math.sin(rotX);
    const cy = Math.cos(rotY), sy = Math.sin(rotY);
    const cz = Math.cos(rotZ), sz = Math.sin(rotZ);

    // M = R_x * R_y * R_z
    // Tomamos sólo la parte 2x2 para X e Y, asumiendo Z_local = 0.
    const m00 = cy * cz;
    const m01 = -cy * sz;
    const m10 = sx * sy * cz + cx * sz;
    const m11 = -sx * sy * sz + cx * cz;

    return new Mat3([
      m00, m01, 0,
      m10, m11, 0,
      0,   0,   1
    ]);
  }

  /**
   * Genera una matriz de escalado.
   * @param {number} sx
   * @param {number} sy
   * @returns {Mat3}
   */
  static escalado(sx, sy) {
    return new Mat3([
      sx, 0,  0,
      0,  sy, 0,
      0,  0,  1
    ]);
  }

  /**
   * Genera la matriz de proyección ortográfica de píxeles a NDC [-1, 1].
   * Mapea X: [0, ancho] -> [-1, 1] e Y: [0, alto] -> [1, -1] (origen top-left).
   * @param {number} ancho
   * @param {number} alto
   * @returns {Mat3}
   */
  static proyeccionNDC(ancho, alto) {
    return new Mat3([
      2 / ancho, 0,          -1,
      0,         -2 / alto,  1,
      0,         0,          1
    ]);
  }

  /**
   * Aplica la matriz a un punto 2D (x, y) y devuelve el nuevo punto [x', y'].
   * Asume coordenada homogénea w = 1.
   * @param {number} x
   * @param {number} y
   * @returns {number[]}
   */
  transformarPunto(x, y) {
    const e = this.elementos;
    return [
      e[0] * x + e[1] * y + e[2],
      e[3] * x + e[4] * y + e[5]
    ];
  }

  /**
   * Calcula y devuelve la matriz inversa.
   * @returns {Mat3|null} Matriz inversa o null si no es inversible.
   */
  inversa() {
    const e = this.elementos;
    const a00 = e[0], a01 = e[1], a02 = e[2];
    const a10 = e[3], a11 = e[4], a12 = e[5];
    const a20 = e[6], a21 = e[7], a22 = e[8];

    const b01 = a22 * a11 - a12 * a21;
    const b11 = -a22 * a10 + a12 * a20;
    const b21 = a21 * a10 - a11 * a20;

    const det = a00 * b01 + a01 * b11 + a02 * b21;

    if (!det) {
      return null;
    }
    const detInv = 1.0 / det;

    const out = new Float32Array(9);
    out[0] = b01 * detInv;
    out[1] = (-a22 * a01 + a02 * a21) * detInv;
    out[2] = (a12 * a01 - a02 * a11) * detInv;
    out[3] = b11 * detInv;
    out[4] = (a22 * a00 - a02 * a20) * detInv;
    out[5] = (-a12 * a00 + a02 * a10) * detInv;
    out[6] = b21 * detInv;
    out[7] = (-a21 * a00 + a01 * a20) * detInv;
    out[8] = (a11 * a00 - a01 * a10) * detInv;

    return new Mat3(out);
  }
}
