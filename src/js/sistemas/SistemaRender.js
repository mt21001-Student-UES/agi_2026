import Mat3 from "../utils/Mat3.js";
import Mat4 from "../utils/Mat4.js";

/**
 * SistemaRender — Puente entre ECS y ModeloWebGL
 * ================================================
 * Pipeline por frame:
 *  1. iniciarFrame() — limpia el canvas.
 *  2. Mat3.proyeccionNDC(W, H) — proyección ortográfica (píxeles → NDC).
 *     - Se recalcula solo si cambian las dimensiones del canvas.
 *  3. Por cada entidad con geometría visible:
 *     a. tf.actualizarMatriz() — calcula T·R·S (lazy con dirty flag).
 *     b. finalMatrix = projMatrix × modelMatrix.
 *     c. #aplicarMatrizTransform(buffer, finalMatrix) — transforma vértices en CPU.
 *  4. Agrupar por modo de shader y emitir UNA llamada WebGL por grupo.
 *
 * Notas importantes:
 * - Las figuras guardan vértices en PÍXELES LOCALES (centradas en (0,0)).
 * - SistemaRender es el único responsable de proyectar al espacio NDC.
 * - La transformación se hace en CPU (no en GPU), lo cual simplifica el pipeline
 *   pero implica más carga si hay muchos vértices.
 * - El eje Z se maneja como un offset adicional (tf.z + z_local), suficiente para
 *   dar un efecto 3D creíble sin necesidad de matrices 4x4 completas.
 * - Escalado en Z no se aplica en Mat3 (limitación inherente a matrices 3x3).
 *   Si se requiere un 3D real, habría que migrar a Mat4.
 */
export default class SistemaRender {
  #webgl;
  #escena;

  /**
   * @param {import('../graficos/ModeloWebGL.js').default} webgl
   * @param {import('../core/Escena.js').default}          escena
   */
  constructor(webgl, escena) {
    this.#webgl = webgl;
    this.#escena = escena;
  }

  /**
   * Llamado por Motor.js cada frame.
   * @param {number} deltaTime Segundos desde el frame anterior
   */
  update(deltaTime) {
    // ── 1. Limpiar canvas ─────────────────────────────────────────────────
    this.#webgl.iniciarFrame();

    const W = this.#webgl.canvas.width;
    const H = this.#webgl.canvas.height;

    // ── 2. Proyección ortográfica (píxeles → NDC) — se calcula UNA vez ───
    // Origen top-left: X:[0,W]→[-1,1], Y:[0,H]→[1,-1]
    let projDirty = false;
    if (this._lastW !== W || this._lastH !== H) {
      this._projMatrix = Mat3.proyeccionNDC(W, H);
      this._projMatrix4 = Mat4.proyeccionNDC(W, H);
      this._lastW = W;
      this._lastH = H;
      projDirty = true;
    }
    const projMatrix = this._projMatrix;
    const projMatrix4 = this._projMatrix4;

    // ── 3. Obtener y ordenar entidades renderizables ──────────────────────
    const entidades = this.#escena.consultarPorComponente("geometria");
    entidades.sort((a, b) => (a.render?.orden ?? 0) - (b.render?.orden ?? 0));

    // Acumuladores por modo de shader (mínimo cambio de programa WebGL)
    const grupos = new Map(); // Map<string, { data: number[], tamaño: number }>

    for (const entidad of entidades) {
      if (entidad.render?.visible === false) continue;

      const geom = entidad.geometria;
      const tf = entidad.transform;
      const modo = entidad.render?.modo ?? "puntos";
      const tamaño = entidad.render?.tamañoPunto ?? 5;

      // ── 4a. Buffer local (rasterizado en píxeles; usa caché dirty flag) ─
      const buffer = geom.obtenerBuffer();
      if (!buffer?.length) continue;

      // ── 4b. Matriz del modelo (T·R·S), lazy ──────────────────────────────
      let modelMatrix;
      let tfWasDirty = tf?.dirty || false;
      if (tf) {
        if (tfWasDirty) {
          tf.actualizarMatriz(); // no-op si no esta sucio
        }
        modelMatrix = tf.matriz;
      } else {
        modelMatrix = new Mat3(); // identidad (entidades sin transform)
      }

      // Si es modo 3D con Mat4, se procesa distinto (por entidad, en GPU)
      if (modo === "puntos3d") {
        const modelMatrix4 = tf && tf.modo3D ? tf.matriz4 : new Mat4();
        const finalMatrix4 = projMatrix4.multiplicar(modelMatrix4);

        if (!grupos.has("puntos3d")) grupos.set("puntos3d", { entidades: [] });
        grupos.get("puntos3d").entidades.push({
          data: buffer,
          tamaño,
          matriz: finalMatrix4.aColumnMajor(),
        });
        continue;
      }

      // Verificamos si el buffer necesita ser recalculado (CPU transform)
      const needsTransform =
        projDirty ||
        tfWasDirty ||
        entidad._lastBuffer !== buffer ||
        !entidad._cacheTransformado;

      if (needsTransform) {
        // ── 4c. Matriz final = Proyección × Modelo ────────────────────────────
        const finalMatrix = projMatrix.multiplicar(modelMatrix);

        // ── 4d. Transformar vértices en CPU y acumular ────────────────────────
        entidad._cacheTransformado = this.#aplicarMatrizTransform(
          buffer,
          finalMatrix,
          tf?.z ?? 0,
        );
        entidad._lastBuffer = buffer;
      }

      const transformado = entidad._cacheTransformado;

      if (!grupos.has(modo)) grupos.set(modo, { data: [], tamaño });
      const dest = grupos.get(modo).data;
      for (let i = 0; i < transformado.length; i++) dest.push(transformado[i]);
    }

    // ── 5. Una sola llamada WebGL por modo de shader ──────────────────────
    for (const [modo, obj] of grupos) {
      if (modo === "puntos3d") {
        for (const e of obj.entidades) {
          this.#webgl.dibujarPuntos3D(e.data, e.matriz, e.tamaño);
        }
        continue;
      }

      const { data, tamaño } = obj;
      if (!data.length) continue;

      switch (modo) {
        case "puntos":
          this.#webgl.dibujarPuntos(data, tamaño);
          break;
        case "lineas_gl":
          this.#webgl.dibujarLineasGL(data);
          break;
        case "triangulos":
          this.#webgl.dibujarTriangulos(data);
          break;
        default:
          this.#webgl.dibujarTriangulos(data, modo);
          break;
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PRIVADO
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Aplica una matriz Mat3 a cada vértice [x,y] del buffer y suma la profundidad Z.
   * Formato del buffer: [x, y, z, r, g, b, ...]  (6 floats por vértice)
   *
   * @param {Float32Array} buffer     Buffer local de la figura
   * @param {Mat3}         matriz     Matriz final (Proyección × Modelo)
   * @param {number}       zWorld     Offset de profundidad del TransformComponent
   * @returns {Float32Array}
   */
  #aplicarMatrizTransform(buffer, matriz, zWorld) {
    const out = new Float32Array(buffer.length);

    for (let i = 0; i < buffer.length; i += 6) {
      const [xNDC, yNDC] = matriz.transformarPunto(buffer[i], buffer[i + 1]);

      out[i] = xNDC;
      out[i + 1] = yNDC;
      out[i + 2] = buffer[i + 2] + zWorld; // z local + z mundo
      out[i + 3] = buffer[i + 3]; // r
      out[i + 4] = buffer[i + 4]; // g
      out[i + 5] = buffer[i + 5]; // b
    }
    return out;
  }

  /** Expone el canvas para que otros sistemas consulten dimensiones */
  get canvas() {
    return this.#webgl.canvas;
  }
}
