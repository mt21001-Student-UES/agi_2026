import VertexShaderProvider from "./shaders/vertex_shader_provider.js";
import FragmentShaderProvider from "./shaders/fragment_shader_provider.js";
class ModeloWebGL {
  /**
   * Instancia única del canvas
   * @param {HTMLCanvasElement} canvas Canvas con las dimensiones iniciales
   * @param {boolean} redimensionable Si se puede cambiar de tamaño
   * @param {Array} fondoColor
   * @param {Array} pointColor
   * @param {number} pointSize
   */
  constructor(
    canvas,
    redimensionable = true,
    fondoColor = [0.0, 0.0, 0.0, 1.0],
    puntoColor = [1.0, 1.0, 1.0],
    tamañoPunto = 5.0
  ) {
    if (!canvas || !canvas.width || !canvas.height) {
      throw new Error("Este canvas no es válido");
    }

    // Guardamos dimensiones iniciales en propiedades internas
    this._canvas = canvas;
    this._coordenadas = [];
    this._fondoColor = fondoColor;
    this._puntoColor = puntoColor;
    this._tamañoPunto = tamañoPunto; // Tamaño global(Todos)

    // Propiedad inmutable
    Object.defineProperty(this, "_redimensionable", {
      value: redimensionable,
      writable: false, // no se puede reasignar
      configurable: false, // no se puede borrar
      enumerable: true,
    });

    // contexto WebGL
    try {
      this.gl = canvas.getContext("webgl");
      if (!this.gl) {
        throw new Error("WebGL no es compatible con tu navegador.");
      }
      this.shaderProgram = this._initShaders();
      this.gl.useProgram(this.shaderProgram);
      // Configuración inicial
      this._initConfig();
    } catch (error) {
      alert("Error al inicializar WebGL");
      console.warn(error);
    }
  }

  _initConfig() {
    // Limpiar el canvas, poner un color
    this.gl.clearColor(...this._fondoColor); //color

    // Color del punto tamaño
    this.uColor = this.gl.getUniformLocation(this.shaderProgram, "uColor");
    this.uPointSize = this.gl.getUniformLocation(
      this.shaderProgram,
      "uPointSize"
    );

    this.gl.uniform4f(this.uColor, ...this._puntoColor, 1.0); // negro
    this.gl.uniform1f(this.uPointSize, this._tamañoPunto); // tamaño 10 px

    // Habilitar profundidad, si un punto está abajo no lo va a renderizar
    this.gl.enable(this.gl.DEPTH_TEST);

    // Limpiar el buffer bit (si ya hay algo dibujado, lo borra)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Establecer el viewport, el área de dibujo del canvas
    this.gl.viewport(0, 0, this._canvas.width, this._canvas.height);

    // Instanciar el buffer una única vez
    this._vertex_buffer = this.gl.createBuffer();
  }

  _initShaders() {
    // --- Compilación y enlace de shaders ---
    // Obtenemos el código fuente de los shaders
    const vertexShaderSrc = new VertexShaderProvider().threePointShader;
    const fragmentShaderSrc = new FragmentShaderProvider().theFragmentShader;

    // Creamos los objetos shader
    const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

    // Asociamos el código fuente
    this.gl.shaderSource(vertexShader, vertexShaderSrc);
    this.gl.shaderSource(fragmentShader, fragmentShaderSrc);

    // Compilamos cada shader
    this.gl.compileShader(vertexShader);
    this.gl.compileShader(fragmentShader);

    // Creamos el programa y adjuntamos los shaders
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    // Enlazamos el programa
    this.gl.linkProgram(program);

    // --- Validación ---
    // Verificamos que el programa se haya enlazado correctamente
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new Error("Error al enlazar: ", this.gl.getProgramInfoLog(program));
    }

    // Verificar si el shader se haya compilado correctamente
    if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
      throw new Error(
        "Error al compilar: ",
        this.gl.getShaderInfoLog(vertexShader)
      );
    }

    // Retornamos el programa para usarlo, solo puedo tener uno a la vez
    return program;
  }

  // --- Servicios ---

  agregarPunto(x, y, z) {
    // Se agrega el punto(sin ordenar)
    if (
      typeof x === "number" &&
      typeof y === "number" &&
      typeof z === "number"
    ) {
      this._coordenadas.push(x, y, z, ...this._puntoColor);
      // Redibujamos
      this.dibujar();
    } else {
      alert("Proporcione todas las coordenadas numéricas!");
    }
  }

  borrarUltimoPunto() {
    // Se borra el punto(las últimas 6 coordenadas)
    for (let i = 0; i < 6; i++) {
      this._coordenadas.pop();
    }
    // Redibujamos
    this.dibujar();
  }

  borrarCoordenadas() {
    this._coordenadas = [];
    // Limpiar el buffer bit (si ya hay algo dibujado, lo borra)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  /**
   * Pasar coordenadas directamente
   * @param {Array<number>} coordenadas
   */
  dibujarFrame(coordenadas) {
    this._coordenadas = coordenadas;
    this.dibujar();
  }

  dibujar() {
    // Limpiar el canvas
    this.gl.clearColor(...this._fondoColor);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Usar el programa activo
    this.gl.useProgram(this.shaderProgram);

    // --- Buffer de vértices ---
    // Creamos un buffer y lo asociamos(binding) al ARRAY_BUFFER
    //const vertex_buffer = this.gl.createBuffer(); // Debería crearse una sola vez
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._vertex_buffer);

    // Cargamos los datos de coordenadas en el buffer
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(this._coordenadas),
      this.gl.STATIC_DRAW
    );

    // --- Atributos del shader ---
    // Obtenemos la ubicación del atributo 'coordenadas' en el vertex shader
    const coordLocation = this.gl.getAttribLocation(
      this.shaderProgram,
      "coordenadas"
    );
    if (coordLocation === -1) {
      throw new Error("El atributo 'coordenadas' no existe en el shader");
    }

    // Definimos cómo leer los datos del buffer

    const stride = 6 * Float32Array.BYTES_PER_ELEMENT;

    this.gl.vertexAttribPointer(
      coordLocation, // índice del atributo
      3, // número de componentes por vértice (x,y,z)
      this.gl.FLOAT, // tipo de dato
      false, // no normalizado
      stride, // stride (0 = consecutivo)
      0 // offset inicial
    );

    // --- Colores ---
    const colorLocation = this.gl.getAttribLocation(
      this.shaderProgram,
      "color"
    );
    this.gl.vertexAttribPointer(
      colorLocation,
      3, // r,g,b
      this.gl.FLOAT,
      false,
      stride,
      3 * Float32Array.BYTES_PER_ELEMENT // offset después de x,y,z
    );
    this.gl.enableVertexAttribArray(colorLocation);

    // Habilitamos el atributo
    this.gl.enableVertexAttribArray(coordLocation);

    // --- Dibujo ---
    // Dibujamos todos los puntos almacenados
    this.gl.drawArrays(
      this.gl.POINTS, // mode
      0, // first
      this._coordenadas.length / 6 // count
    );
  }

  /**
   * Método para redimensionar
   * @param {number} nuevoAncho
   * @param {number} nuevoAlto
   */
  setDimensiones(nuevoAncho, nuevoAlto) {
    if (!this._redimensionable) {
      throw new Error("Este canvas no se puede redimensionar");
    }
    const ancho = parseInt(nuevoAncho);
    const alto = parseInt(nuevoAlto);
    // Actualizar viewport
    this.gl.viewport(0, 0, ancho, alto);
    this._canvas.width = ancho;
    this._canvas.height = alto;
    // Redibujar
    this.dibujar();
  }

  /**
   * Convierte hexadecimal a rgb y normaliza para cambiar el color del fondo
   * Solo acepta formato hexadecimal. Ejemplo:#000000
   * @param {text} colorHexadecimal
   */
  setColorFondo(colorHexadecimal) {
    //console.log(colorHexadecimal);
    const regexHexa = /^#[0-9A-Fa-f]{6}$/;
    if (regexHexa.test(colorHexadecimal)) {
      const r = parseInt(colorHexadecimal.substr(1, 2), 16) / 255;
      const g = parseInt(colorHexadecimal.substr(3, 2), 16) / 255;
      const b = parseInt(colorHexadecimal.substr(5, 2), 16) / 255;
      this._fondoColor = [r, g, b, 1.0];
      this.dibujar();
    } else {
      alert("Color inválido");
    }
  }

  /**
   * Convierte hexadecimal a rgb y normaliza para cambiar color del punto
   * Solo acepta formato hexadecimal. Ejemplo:#000000
   * @param {text} colorHexadecimal
   */
  setColorPunto(colorHexadecimal) {
    //console.log(colorHexadecimal);
    const regexHexa = /^#[0-9A-Fa-f]{6}$/;
    if (regexHexa.test(colorHexadecimal)) {
      const r = parseInt(colorHexadecimal.substr(1, 2), 16) / 255;
      const g = parseInt(colorHexadecimal.substr(3, 2), 16) / 255;
      const b = parseInt(colorHexadecimal.substr(5, 2), 16) / 255;
      this._puntoColor = [r, g, b];
      this.gl.uniform4f(this.uColor, ...this._puntoColor, 1.0);
    } else {
      alert("Color inválido");
    }
  }

  /**
   * Tamaño global de los puntos
   * @param {number} tamaño
   */
  setTamañoPunto(tamaño) {
    try {
      this.gl.uniform1f(this.uPointSize, parseInt(tamaño));
      this._tamañoPunto = tamaño;
      this.dibujar();
    } catch {
      alert("Tamaño del punto inválido");
    }
  }

  get ancho() {
    return this._canvas.width;
  }

  get alto() {
    return this._canvas.height;
  }

  set ancho(nuevoAncho) {
    if (!this._redimensionable) {
      throw new Error("El canvas no se puede redimensionar");
    }
    this._canvas.width = nuevoAncho;
    // Redibujar
    this.dibujar();
  }

  set alto(nuevoAlto) {
    if (!this._redimensionable) {
      throw new Error("El canvas no se puede redimensionar");
    }
    this._canvas.height = nuevoAlto;
    // Redibujar
    this.dibujar();
  }
}

export default ModeloWebGL;
