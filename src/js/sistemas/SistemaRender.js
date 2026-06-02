/**
 * SistemaRender — Puente entre ECS y ModeloWebGL
 * ================================================
 * Se ejecuta una vez por frame (llamado por Motor.js).
 *
 * Responsabilidades:
 *  1. Pedir a ModeloWebGL que limpie el canvas (iniciarFrame).
 *  2. Consultar a la Escena solo las entidades que tienen geometría visible.
 *  3. Obtener el buffer de cada entidad (con caché de dirty flag).
 *  4. Aplicar el TransformComponent (offset de posición) al buffer.
 *  5. Agrupar los buffers por modo de shader.
 *  6. Hacer UNA sola llamada a ModeloWebGL por modo (mínimo cambio de programa).
 *
 * Lo que NO hace:
 *  - No llama a requestAnimationFrame (eso es Motor.js)
 *  - No sabe cómo se calculan los vértices (eso es GeometriaComponent + FiguraInterface)
 *  - No compila shaders (eso es ModeloWebGL)
 */
export default class SistemaRender {
  #webgl;
  #escena;

  /**
   * @param {import('../graficos/ModeloWebGL.js').default} webgl
   *   Instancia del nuevo ModeloWebGL (graficos/).
   * @param {import('../core/Escena.js').default} escena
   *   Escena activa (fuente de entidades).
   */
  constructor(webgl, escena) {
    this.#webgl = webgl;
    this.#escena = escena;
  }

  /**
   * Llamado por Motor.js cada frame.
   * @param {number} deltaTime  Tiempo en segundos desde el frame anterior
   */
  update(deltaTime) {
    // ── 1. Limpiar canvas y dibujar fondo ──────────────────────────────────
    this.#webgl.iniciarFrame();

    // ── 2. Obtener entidades renderizables ────────────────────────────────
    // Requerimos 'geometria' como mínimo; 'transform' y 'render' son opcionales
    // (si no tienen transform se dibujan en el origen; si no tienen render se
    //  usan los valores por defecto del modo 'puntos').
    const entidades = this.#escena.consultarPorComponente("geometria");

    // Ordenar por RenderComponent.orden (mayor = se dibuja encima)
    entidades.sort((a, b) => (a.render?.orden ?? 0) - (b.render?.orden ?? 0));

    // ── 3. Agrupar vértices por modo de shader ────────────────────────────
    // Acumular todos los vértices de cada modo en un único array para hacer
    // la menor cantidad posible de llamadas a drawArrays().
    const grupos = new Map(); // Map<string, number[]>

    for (const entidad of entidades) {
      // Saltar invisibles
      if (entidad.render?.visible === false) continue;

      const geom = entidad.geometria;
      const tf = entidad.transform ?? { x: 0, y: 0, z: 0 };
      const modo = entidad.render?.modo ?? "puntos";
      const tamaño = entidad.render?.tamañoPunto ?? 5;

      // ── 4. Obtener buffer (usa caché si no está sucio) ──────────────────
      const buffer = geom.obtenerBuffer();
      if (!buffer?.length) continue;

      // ── 5. Aplicar Transform (offset de posición en CPU) ─────────────────
      // La figura almacena vértices locales. El Transform es el offset mundial.
      // Esto es barato: solo sumas. Si en el futuro quieres hacerlo en GPU,
      // pasa el transform como uniform al vertex shader.
      const transformado = this.#aplicarTransform(buffer, tf);

      // ── 6. Acumular por modo ──────────────────────────────────────────────
      if (!grupos.has(modo)) grupos.set(modo, { data: [], tamaño });
      grupos.get(modo).data.push(...transformado);
    }

    // ── 7. Una llamada a WebGL por modo de shader ─────────────────────────
    for (const [modo, { data, tamaño }] of grupos) {
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
          // Modo personalizado registrado con modeloWebGL.registrarPrograma()
          this.#webgl.dibujarTriangulos(data, modo);
          break;
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PRIVADO
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Aplica el TransformComponent completo (escala + traslación) al buffer.
   * Formato del buffer: [x, y, z, r, g, b, ...]
   *
   * Orden correcto: primero escalar alrededor del origen local (0,0),
   * luego trasladar al origen mundial del transform.
   * Esto garantiza que la animación pop-in de escala 0→1 funcione.
   *
   * @param {Float32Array} buffer
   * @param {{ x:number, y:number, z:number, escala:number }} transform
   * @returns {Float32Array}
   */
  #aplicarTransform(buffer, transform) {
    const out = new Float32Array(buffer.length);
    const escala = transform.escala ?? 1;
    const tx = transform.x ?? 0;
    const ty = transform.y ?? 0;
    const tz = transform.z ?? 0;

    for (let i = 0; i < buffer.length; i += 6) {
      // 1. Escalar alrededor del origen local de la figura
      out[i] = buffer[i] * escala + tx;
      out[i + 1] = buffer[i + 1] * escala + ty;
      out[i + 2] = buffer[i + 2] * escala + tz;
      // 2. Color — no se transforma
      out[i + 3] = buffer[i + 3];
      out[i + 4] = buffer[i + 4];
      out[i + 5] = buffer[i + 5];
    }
    return out;
    // Pendiente de optimización
    // Pendiente de rotación y proyección en Z etc
  }
}
