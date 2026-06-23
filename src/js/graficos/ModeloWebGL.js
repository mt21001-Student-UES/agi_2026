import VertexShaderProvider from "../control/shaders/vertex_shader_provider.js";
import FragmentShaderProvider from "../control/shaders/fragment_shader_provider.js";
import hexToGlColor from "../utils/hexToRGB.js";

/**
 * ModeloWebGL — Capa de bajo nivel WebGL, multi-shader
 * =====================================================
 *
 * DIFERENCIAS CON LA VERSIÓN ANTERIOR (control/modeloWebGL.js):
 *  ✗ Ya NO tiene bucle de animación propio → lo gestiona Motor.js
 *  ✗ Ya NO llama a requestAnimationFrame
 *  ✓ Expone `iniciarFrame()` para que SistemaRender limpie el canvas
 *  ✓ Expone métodos de dibujo atómicos por tipo de primitiva:
 *      dibujarPuntos()      → gl.POINTS   (uso principal: figuras rasterizadas)
 *      dibujarLineasGL()    → gl.LINES    (wireframes, ejes, grids)
 *      dibujarTriangulos()  → gl.TRIANGLES (figuras rellenas, futuros shaders 3D)
 *  ✓ Buffers con DYNAMIC_DRAW (se reescriben cada frame, nunca se recrean)
 *  ✓ `registrarPrograma()` permite añadir shaders en caliente sin tocar el constructor
 *  ✓ Cambio de programa optimizado: useProgram() solo cuando es necesario
 *
 * FLUJO POR FRAME (llamado desde SistemaRender):
 *   1. modeloWebGL.iniciarFrame()        → clear + fondo
 *   2. modeloWebGL.dibujarPuntos(data)   → todas las entidades modo 'puntos'
 *   3. modeloWebGL.dibujarTriangulos(d)  → entidades modo 'triangulos' (opcional)
 */
export default class ModeloWebGL {
  // ─── Estado interno ───────────────────────────────────────────────────────
  #gl;
  #canvas;
  #colorFondo; // [r, g, b, a] normalizado
  #texturaFondo; // WebGLTexture | null
  #programas; // Map<string, WebGLProgram>
  #buffers; // Map<string, WebGLBuffer>
  #programaActual; // string | null — evita useProgram() redundantes

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Object}  [opciones]
   * @param {string}  [opciones.colorFondo='#000000']   Color de fondo hex
   * @param {string}  [opciones.texturaFondo=null]      URL de imagen de fondo
   */
  constructor(canvas, opciones = {}) {
    if (!canvas?.width || !canvas?.height)
      throw new Error("[ModeloWebGL] Canvas inválido o sin dimensiones.");

    const cfg = { colorFondo: "#000000", texturaFondo: null, ...opciones };

    this.#canvas = canvas;
    this.#colorFondo = hexToGlColor(cfg.colorFondo);
    this.#texturaFondo = null;
    this.#programas = new Map();
    this.#buffers = new Map();
    this.#programaActual = null;

    // — Iniciar contexto WebGL —
    this.#gl = canvas.getContext("webgl", { alpha: true });
    if (!this.#gl)
      throw new Error(
        "[ModeloWebGL] WebGL no está soportado en este navegador.",
      );

    this.#compilarProgramasBase();
    this.#crearBuffers();
    this.#configurarEstadoGlobal();

    if (cfg.texturaFondo) this.cargarImagenComoTextura(cfg.texturaFondo);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  API PÚBLICA — Control de frame
  //  SistemaRender llama estos métodos en cada update()
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Limpia el canvas y dibuja el fondo.
   * Debe llamarse UNA VEZ al inicio de cada frame, antes de dibujar entidades.
   */
  iniciarFrame() {
    const gl = this.#gl;

    if (this.#texturaFondo) {
      gl.clearColor(0, 0, 0, 0); // transparente: la textura es el fondo
    } else {
      gl.clearColor(...this.#colorFondo);
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (this.#texturaFondo) {
      this.#dibujarFondo();
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  API PÚBLICA — Métodos de dibujo atómicos por tipo de primitiva
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Dibuja puntos. Es la primitiva principal para figuras rasterizadas
   * (Circulo con octantes, Linea Bresenham, Cuadrado con DDA, etc.)
   *
   * @param {Float32Array|number[]} data       Formato interleaved: [x,y,z, r,g,b, ...]
   * @param {number}                [tamañoPunto=5]  Tamaño en píxeles del punto
   */
  dibujarPuntos(data, tamañoPunto = 5) {
    if (!data?.length) return;
    const gl = this.#gl;
    const programa = this.#activarPrograma("puntos");
    const buffer = this.#buffers.get("puntos");

    // Subir datos al buffer (DYNAMIC_DRAW: cambia cada frame, memoria en GPU)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.#aFloat32(data), gl.DYNAMIC_DRAW);

    this.#bindAtributosXYZRGB(programa);

    gl.uniform1f(gl.getUniformLocation(programa, "uPointSize"), tamañoPunto);

    gl.drawArrays(gl.POINTS, 0, data.length / 6);
  }

  /**
   * Dibuja puntos usando el shader 3D con una matriz Mat4 de modelo.
   * La transformación se ejecuta EN LA GPU (uniform mat4 uMatrix).
   *
   * A diferencia de dibujarPuntos(), los vértices llegan en coordenadas
   * locales/mundo y la multiplicación por la matriz de modelo+proyección
   * se hace en el vertex shader.
   *
   * @param {Float32Array|number[]} data          Formato: [x,y,z, r,g,b, ...]
   * @param {Float32Array}          matrizUniform  Mat4 en column-major (16 floats)
   * @param {number}                [tamañoPunto=5]
   */
  dibujarPuntos3D(data, matrizUniform, tamañoPunto = 5) {
    if (!data?.length) return;
    const gl = this.#gl;
    const programa = this.#activarPrograma("puntos3d");
    const buffer = this.#buffers.get("puntos3d");

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.#aFloat32(data), gl.DYNAMIC_DRAW);

    this.#bindAtributosXYZRGB(programa);

    gl.uniform1f(gl.getUniformLocation(programa, "uPointSize"), tamañoPunto);
    gl.uniformMatrix4fv(
      gl.getUniformLocation(programa, "uMatrix"),
      false,
      matrizUniform,
    );

    gl.drawArrays(gl.POINTS, 0, data.length / 6);
  }

  /**
   * Dibuja líneas nativas de WebGL (sin algoritmo de rasterización).
   * Útil para: grids de depuración, ejes de coordenadas, wireframes.
   * Cada par consecutivo de vértices forma una línea independiente.
   *
   * @param {Float32Array|number[]} data  Formato: [x,y,z, r,g,b, ...]
   */
  dibujarLineasGL(data) {
    console.warn(
      "Se esta usando dibujarLineasGL. Verifique que esta usando esta funcion correctamente",
    );
    if (!data?.length) return;
    const gl = this.#gl;
    const programa = this.#activarPrograma("puntos"); // mismo shader, distinta primitiva
    const buffer = this.#buffers.get("lineas");

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.#aFloat32(data), gl.DYNAMIC_DRAW);

    this.#bindAtributosXYZRGB(programa);
    gl.uniform1f(gl.getUniformLocation(programa, "uPointSize"), 1);
    gl.drawArrays(gl.LINES, 0, data.length / 6);
  }

  /**
   * Dibuja triángulos (figuras rellenas, futuras figuras 3D sombreadas).
   * Actualmente usa el mismo shader de puntos coloreados.
   * Para sombreado real, registrar un shader propio con registrarPrograma().
   *
   * @param {Float32Array|number[]} data  Formato: [x,y,z, r,g,b, ...]
   * @param {string} [claveShader='puntos']  Shader a usar (si registraste uno propio)
   */
  dibujarTriangulos(data, claveShader = "puntos") {
    console.warn(
      "Se esta usando dibujarTriangulos. Verifique que esta usando esta funcion correctamente",
    );
    if (!data?.length) return;
    const gl = this.#gl;
    const programa = this.#activarPrograma(claveShader);
    const buffer = this.#buffers.get("triangulos");

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.#aFloat32(data), gl.DYNAMIC_DRAW);

    this.#bindAtributosXYZRGB(programa);
    gl.uniform1f(gl.getUniformLocation(programa, "uPointSize"), 1);
    gl.drawArrays(gl.TRIANGLES, 0, data.length / 6);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  API PÚBLICA — Extensibilidad de shaders
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Registra un nuevo programa shader sin tocar el constructor.
   * Útil para añadir shaders especiales: partículas, niebla, normal maps, etc.
   *
   * @param {string} clave        Identificador único ('particulas', 'sombra'…)
   * @param {string} vertexSrc    Código GLSL del vertex shader
   * @param {string} fragmentSrc  Código GLSL del fragment shader
   *
   * @example
   *   modeloWebGL.registrarPrograma('niebla', nieblaVert, nieblaFrag);
   *   // Luego en la entidad: new RenderComponent('niebla')
   *   // Y en SistemaRender:  modeloWebGL.dibujarTriangulos(data, 'niebla')
   */
  registrarPrograma(clave, vertexSrc, fragmentSrc) {
    if (this.#programas.has(clave))
      console.warn(`[ModeloWebGL] Sobreescribiendo programa '${clave}'.`);

    this.#programas.set(clave, this.#compilar(vertexSrc, fragmentSrc));

    // Crear buffer dedicado para este nuevo modo si no existe
    if (!this.#buffers.has(clave))
      this.#buffers.set(clave, this.#gl.createBuffer());
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  API PÚBLICA — Configuración en caliente
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Cambia el color del fondo sólido.
   * @param {string} hex  Color hexadecimal (#RRGGBB)
   */
  setColorFondo(hex) {
    this.#colorFondo = hexToGlColor(hex);
  }

  /**
   * Redimensiona el canvas y actualiza el viewport de WebGL.
   * @param {number} ancho
   * @param {number} alto
   */
  setDimensiones(ancho, alto) {
    this.#canvas.width = parseInt(ancho);
    this.#canvas.height = parseInt(alto);
    this.#gl.viewport(0, 0, this.#canvas.width, this.#canvas.height);
  }

  /**
   * Asigna directamente una WebGLTexture como fondo (sin cargar imagen).
   * @param {WebGLTexture} textura
   * @param {number}       [ancho]
   * @param {number}       [alto]
   */
  setTexturaFondo(textura, ancho, alto) {
    this.#texturaFondo = textura;
    if (ancho && alto) this.setDimensiones(ancho, alto);
  }

  /**
   * Carga una imagen desde URL y la usa como textura de fondo.
   * Emite el evento 'imagenCargada' en el canvas cuando termina.
   *
   * @param {string}   src        URL de la imagen
   * @param {Function} [callback] (textura, ancho, alto) => void
   * @param {string}   [nombre]   Nombre descriptivo (para el evento)
   */
  cargarImagenComoTextura(src, callback, nombre) {
    const gl = this.#gl;
    const textura = gl.createTexture();
    const imagen = new Image();
    imagen.crossOrigin = "anonymous";

    imagen.onload = () => {
      // Ajustar canvas a la imagen (con límites máximos)
      this.#canvas.width = Math.min(imagen.width, 1920);
      this.#canvas.height = Math.min(imagen.height, 1080);
      gl.viewport(0, 0, this.#canvas.width, this.#canvas.height);

      gl.bindTexture(gl.TEXTURE_2D, textura);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        imagen,
      );

      // Parámetros seguros para texturas NPOT (non-power-of-two)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      this.#texturaFondo = textura;

      this.#canvas.dispatchEvent(
        new CustomEvent("imagenCargada", {
          detail: {
            nombre,
            src,
            textura,
            ancho: imagen.width,
            alto: imagen.height,
          },
        }),
      );

      if (callback) callback(textura, imagen.width, imagen.height);
    };

    imagen.src = src;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PRIVADO — Inicialización
  // ══════════════════════════════════════════════════════════════════════════

  /** Compila los programas shader predeterminados */
  #compilarProgramasBase() {
    const vp = new VertexShaderProvider();
    const fp = new FragmentShaderProvider();

    // Programa principal: puntos coloreados (x,y,z + r,g,b por vértice)
    this.#programas.set(
      "puntos",
      this.#compilar(vp.threePointShader, fp.theFragmentShader),
    );

    // Programa 3D: puntos con transformación Mat4 en GPU
    this.#programas.set(
      "puntos3d",
      this.#compilar(vp.threeDShader, fp.theFragmentShader),
    );

    // Programa de textura: solo para el quad de fondo
    this.#programas.set(
      "textura",
      this.#compilar(vp.textureBackgroundShader, fp.textureBackgroundShader),
    );
  }

  /** Crea los buffers reutilizables (uno por tipo de primitiva) */
  #crearBuffers() {
    const gl = this.#gl;

    // Buffers de datos variables (DYNAMIC_DRAW → se reescriben cada frame)
    this.#buffers.set("puntos", gl.createBuffer());
    this.#buffers.set("puntos3d", gl.createBuffer());
    this.#buffers.set("lineas", gl.createBuffer());
    this.#buffers.set("triangulos", gl.createBuffer());

    // Buffer estático del quad de fondo (STATIC_DRAW → se sube una sola vez)
    // Formato: x, y, z, u, v  (3 posición + 2 UV de textura)
    const fondoBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, fondoBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1, 0, 0, 1, 1, -1, 0, 1, 1, -1, 1, 0, 0, 0, 1, 1, 0, 1, 0,
      ]),
      gl.STATIC_DRAW,
    );
    this.#buffers.set("fondo", fondoBuf);
  }

  #configurarEstadoGlobal() {
    const gl = this.#gl;
    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, this.#canvas.width, this.#canvas.height);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PRIVADO — Helpers reutilizables
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Compila vertex + fragment shader y enlaza el programa.
   * Libera la memoria de compilación de los shaders al terminar.
   */
  #compilar(vertexSrc, fragmentSrc) {
    const gl = this.#gl;

    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vertexSrc);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
      throw new Error(
        "[ModeloWebGL] Vertex shader:\n" + gl.getShaderInfoLog(vs),
      );

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fragmentSrc);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
      throw new Error(
        "[ModeloWebGL] Fragment shader:\n" + gl.getShaderInfoLog(fs),
      );

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
      throw new Error(
        "[ModeloWebGL] Link error:\n" + gl.getProgramInfoLog(prog),
      );

    // Los shaders ya están enlazados; la GPU guarda el programa compilado.
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    return prog;
  }

  /**
   * Activa un programa shader solo si es distinto al activo.
   * Cambiar de programa en WebGL es costoso → minimizar al agrupar por modo.
   * @param {string} clave
   * @returns {WebGLProgram}
   */
  #activarPrograma(clave) {
    if (this.#programaActual !== clave) {
      const prog = this.#programas.get(clave);
      if (!prog)
        throw new Error(
          `[ModeloWebGL] Programa desconocido: '${clave}'. Registra con registrarPrograma().`,
        );
      this.#gl.useProgram(prog);
      this.#programaActual = clave;
    }
    return this.#programas.get(clave);
  }

  /**
   * Configura los atributos de vértice para el formato interleaved [xyz rgb].
   * Stride = 6 floats = 24 bytes
   */
  #bindAtributosXYZRGB(programa) {
    const gl = this.#gl;
    const FLOAT = Float32Array.BYTES_PER_ELEMENT; // 4 bytes
    const stride = 6 * FLOAT; // x,y,z,r,g,b

    const coordLoc = gl.getAttribLocation(programa, "coordenadas");
    gl.vertexAttribPointer(coordLoc, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(coordLoc);

    const colorLoc = gl.getAttribLocation(programa, "color");
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, stride, 3 * FLOAT);
    gl.enableVertexAttribArray(colorLoc);
  }

  /** Dibuja el quad de fondo con textura (shader 'textura') */
  #dibujarFondo() {
    const gl = this.#gl;
    const programa = this.#activarPrograma("textura");
    const FLOAT = Float32Array.BYTES_PER_ELEMENT;
    const stride = 5 * FLOAT;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.#buffers.get("fondo"));

    const coordLoc = gl.getAttribLocation(programa, "coordenadas");
    gl.vertexAttribPointer(coordLoc, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(coordLoc);

    const texLoc = gl.getAttribLocation(programa, "aTexCoord");
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, stride, 3 * FLOAT);
    gl.enableVertexAttribArray(texLoc);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.#texturaFondo);
    gl.uniform1i(gl.getUniformLocation(programa, "uSampler"), 0);

    // El fondo siempre debe dibujarse encima de todo (sin depth test)
    gl.disable(gl.DEPTH_TEST);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.enable(gl.DEPTH_TEST);

    // Forzar re-bind del programa siguiente (cambió el contexto de atributos)
    this.#programaActual = null;
  }

  /** Garantiza Float32Array para no crear nuevas instancias si ya lo es */
  #aFloat32(data) {
    return data instanceof Float32Array ? data : new Float32Array(data);
  }

  // GETTERS
  get canvas () {
    return this.#canvas;
  }
}
