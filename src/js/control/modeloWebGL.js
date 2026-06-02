import VertexShaderProvider from "./shaders/vertex_shader_provider.js";
import FragmentShaderProvider from "./shaders/fragment_shader_provider.js";
import hexToGlColor from "../utils/hexToRGB.js";
import {
  esFormatoValidoImg,
  esPotenciaDeDos,
} from "../utils/validarFormatos.js";

export default class ModeloWebGL {
  #gl;
  #canvas;
  #redimensionable;
  #colorFondo;
  #tamañoPunto;
  #texturaFondo;
  #programaTextura;
  #programaPuntos;
  #puntosBuffer;
  #fondoBuffer;

  /**
   * Instancia única del canvas
   * @param {HTMLCanvasElement} canvas Canvas con las dimensiones iniciales
   * @param {boolean} redimensionable Si se puede cambiar de tamaño
   * @param {hexadecimal} colorFondo Fondo del canvas en hexadecimal
   * @param {number} tamañoPunto Tamaño de los puntos
   * @param {string} texturaFondo URL de la imagen para textura de fondo (opcional)
   */
  constructor(canvas, opciones = {}) {
    if (!canvas || !canvas.width || !canvas.height) {
      console.warn("Este canvas no es válido");
      return;
    }

    // Valores por defecto
    const defaults = {
      redimensionable: true,
      colorFondo: "#000000",
      tamañoPunto: 5,
      texturaFondo: null,
    };

    // Fusionar opciones con defaults
    const config = { ...defaults, ...opciones };

    // Inicializar propiedades
    this.#canvas = canvas;
    this.#redimensionable = config.redimensionable;
    this.#colorFondo = hexToGlColor(config.colorFondo);
    this.#tamañoPunto = parseInt(config.tamañoPunto);
    if (config.texturaFondo) {
      this.#texturaFondo = this.cargarImagenComoTextura(config.texturaFondo);
    }

    // Iniciar WebGL
    this.#gl = canvas.getContext("webgl", { alpha: true });
    if (!this.#gl) throw new Error("WebGL no soportado");

    this.#initProgramas();
    this.#initConfiguracion();
  }

  #initProgramas() {
    const vertexProvider = new VertexShaderProvider();
    const fragmentProvider = new FragmentShaderProvider();

    // Programa para textura
    this.#programaTextura = this.#crearPrograma(
      vertexProvider.textureBackgroundShader,
      fragmentProvider.textureBackgroundShader
    );

    // Programa para puntos
    this.#programaPuntos = this.#crearPrograma(
      vertexProvider.threePointShader,
      fragmentProvider.theFragmentShader
    );
  }

  #crearPrograma(vertexShaderSrc, fragmentShaderSrc) {
    // --- Compilación y enlace de shaders ---
    const vertexShader = this.#gl.createShader(this.#gl.VERTEX_SHADER);
    this.#gl.shaderSource(vertexShader, vertexShaderSrc);
    this.#gl.compileShader(vertexShader);

    const fragmentShader = this.#gl.createShader(this.#gl.FRAGMENT_SHADER);
    this.#gl.shaderSource(fragmentShader, fragmentShaderSrc);
    this.#gl.compileShader(fragmentShader);

    // --- Creamos el programa, adjuntamos los shaders y enlazamos ---
    const program = this.#gl.createProgram();
    this.#gl.attachShader(program, vertexShader);
    this.#gl.attachShader(program, fragmentShader);
    this.#gl.linkProgram(program);

    // --- Validación ---
    // Verificar si el shader se haya compilado correctamente
    if (!this.#gl.getShaderParameter(vertexShader, this.#gl.COMPILE_STATUS)) {
      console.error(this.#gl.getShaderInfoLog(vertexShader));
      throw new Error(
        "Error al compilar shaders: ",
        this.#gl.getShaderInfoLog(vertexShader)
      );
    }
    if (!this.#gl.getShaderParameter(fragmentShader, this.#gl.COMPILE_STATUS)) {
      console.error(this.#gl.getShaderInfoLog(fragmentShader));
      throw new Error(
        "Error al compilar shaders: ",
        this.#gl.getShaderInfoLog(fragmentShader)
      );
    }
    // Verificamos que el programa se haya enlazado correctamente
    if (!this.#gl.getProgramParameter(program, this.#gl.LINK_STATUS)) {
      console.error(this.#gl.getProgramInfoLog(program));
      throw new Error(
        "Error al enlazar shaders: ",
        this.#gl.getProgramInfoLog(program)
      );
    }

    // Devolvemos el programa, solo puedo tener uno a la vez
    return program;
  }

  #initConfiguracion() {
    // Configuración global del canvas
    this.#gl.enable(this.#gl.DEPTH_TEST);
    this.#gl.viewport(0, 0, this.#canvas.width, this.#canvas.height);

    // Crear buffer para quad del fondo SIEMPRE
    this.#fondoBuffer = this.#gl.createBuffer();
    this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#fondoBuffer);
    // nota: Y invertido
    const vertices = new Float32Array([
      -1, -1, 0, 0, 1, 1, -1, 0, 1, 1, -1, 1, 0, 0, 0, 1, 1, 0, 1, 0,
    ]);

    this.#gl.bufferData(this.#gl.ARRAY_BUFFER, vertices, this.#gl.STATIC_DRAW);

    // Crear buffer para puntos SIEMPRE
    this.#puntosBuffer = this.#gl.createBuffer();

    // Limpiar canvas según el caso
    if (this.#texturaFondo) {
      this.#gl.clearColor(0.0, 0.0, 0.0, 0.0); // transparente
    } else {
      this.#gl.clearColor(...this.#colorFondo); // color sólido
    }
    this.#gl.clear(this.#gl.COLOR_BUFFER_BIT);
  }

  #dibujarFondo() {
    //console.log("Usando programa de textura", this.#programaTextura);

    this.#gl.useProgram(this.#programaTextura);

    // Vincular el buffer del quad
    this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#fondoBuffer);

    // Configurar atributos del programa de textura
    const coordLoc = this.#gl.getAttribLocation(
      this.#programaTextura,
      "coordenadas"
    );
    const texLoc = this.#gl.getAttribLocation(
      this.#programaTextura,
      "aTexCoord"
    );

    const stride = 5 * Float32Array.BYTES_PER_ELEMENT;
    this.#gl.vertexAttribPointer(coordLoc, 3, this.#gl.FLOAT, false, stride, 0);
    this.#gl.enableVertexAttribArray(coordLoc);

    this.#gl.vertexAttribPointer(
      texLoc,
      2,
      this.#gl.FLOAT,
      false,
      stride,
      3 * Float32Array.BYTES_PER_ELEMENT
    );
    this.#gl.enableVertexAttribArray(texLoc);

    // Vincular textura
    this.#gl.activeTexture(this.#gl.TEXTURE0);
    this.#gl.bindTexture(this.#gl.TEXTURE_2D, this.#texturaFondo);
    const samplerLoc = this.#gl.getUniformLocation(
      this.#programaTextura,
      "uSampler"
    );
    this.#gl.uniform1i(samplerLoc, 0);

    // Dibujar quad
    this.#gl.drawArrays(this.#gl.TRIANGLE_STRIP, 0, 4);
  }

  #dibujarPuntos(coordenadas) {
    //console.log("Dibujando puntos con coordenadas: ", coordenadas);
    //console.log("Usando programa de puntos", this.#programaPuntos);

    this.#gl.useProgram(this.#programaPuntos);

    // Vincular buffer de puntos
    this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#puntosBuffer);
    this.#gl.bufferData(
      this.#gl.ARRAY_BUFFER,
      new Float32Array(coordenadas),
      this.#gl.STATIC_DRAW
    );

    const stride = 6 * Float32Array.BYTES_PER_ELEMENT;

    // Posición
    const coordLoc = this.#gl.getAttribLocation(
      this.#programaPuntos,
      "coordenadas"
    );
    this.#gl.vertexAttribPointer(coordLoc, 3, this.#gl.FLOAT, false, stride, 0);
    this.#gl.enableVertexAttribArray(coordLoc);

    // Color
    const colorLoc = this.#gl.getAttribLocation(this.#programaPuntos, "color");
    this.#gl.vertexAttribPointer(
      colorLoc,
      3,
      this.#gl.FLOAT,
      false,
      stride,
      3 * Float32Array.BYTES_PER_ELEMENT
    );
    this.#gl.enableVertexAttribArray(colorLoc);

    // Tamaño de punto
    const pointSizeLoc = this.#gl.getUniformLocation(
      this.#programaPuntos,
      "uPointSize"
    );
    this.#gl.uniform1f(pointSizeLoc, this.#tamañoPunto);

    /* 
    console.log(
      "Programa activo:",
      this.#gl.getParameter(this.#gl.CURRENT_PROGRAM)
      );
      console.log(
        "Buffer activo:",
        this.#gl.getParameter(this.#gl.ARRAY_BUFFER_BINDING)
        );
        console.log("Cantidad de vértices:", coordenadas.length / 6);
        */

    // Dibujar puntos
    this.#gl.drawArrays(this.#gl.POINTS, 0, coordenadas.length / 6);
  }

  cargarImagenComoTextura(src, callback, nombreReal) {
    const textura = this.#gl.createTexture();
    const imagen = new Image();
    imagen.crossOrigin = "anonymous"; // si el servidor lo soporta
    imagen.onload = () => {
      const maxAncho = 1920; // Máximo ancho permitido
      const maxAlto = 1080; // Máximo alto permitido

      let ancho = imagen.width;
      let alto = imagen.height;
      if (ancho > maxAncho) {
        this.#canvas.width = maxAncho;
      } else {
        this.#canvas.width = ancho;
      }
      if (alto > maxAlto) {
        this.#canvas.height = maxAlto;
      } else {
        this.#canvas.height = alto;
      }
      this.#gl.viewport(0, 0, this.#canvas.width, this.#canvas.height);
      this.#gl.bindTexture(this.#gl.TEXTURE_2D, textura);
      this.#gl.texImage2D(
        this.#gl.TEXTURE_2D,
        0,
        this.#gl.RGBA,
        this.#gl.RGBA,
        this.#gl.UNSIGNED_BYTE,
        imagen
      );

      // Configuración segura para NPOT
      this.#gl.texParameteri(
        this.#gl.TEXTURE_2D,
        this.#gl.TEXTURE_WRAP_S,
        this.#gl.CLAMP_TO_EDGE
      );
      this.#gl.texParameteri(
        this.#gl.TEXTURE_2D,
        this.#gl.TEXTURE_WRAP_T,
        this.#gl.CLAMP_TO_EDGE
      );
      this.#gl.texParameteri(
        this.#gl.TEXTURE_2D,
        this.#gl.TEXTURE_MIN_FILTER,
        this.#gl.LINEAR
      );
      this.#gl.texParameteri(
        this.#gl.TEXTURE_2D,
        this.#gl.TEXTURE_MAG_FILTER,
        this.#gl.LINEAR
      );

      // Solo generar mipmaps si la textura es POT
      if (esPotenciaDeDos(imagen.width) && esPotenciaDeDos(imagen.height)) {
        this.#gl.generateMipmap(this.#gl.TEXTURE_2D);
      }

      // Guardar textura y dibujar cuando esté lista
      this.#texturaFondo = textura;
      this.dibujar();

      const evento = new CustomEvent("imagenCargada", {
        detail: {
          nombre: nombreReal, // <-- usar nombre real
          src,
          textura,
          ancho: imagen.width,
          alto: imagen.height,
        },
      });
      this.#canvas.dispatchEvent(evento);

      if (callback) callback(textura, imagen.width, imagen.height);
    };
    imagen.src = src;
  }

  dibujar(coordenadas = []) {
    //console.log("Coordenadas a dibujar: ", typeof coordenadas, coordenadas);
    if (!(Array.isArray(coordenadas) || ArrayBuffer.isView(coordenadas))) {
      throw new Error("Coordenadas inválidas");
    }

    // --- Limpiar Canvas ---
    if (this.#texturaFondo) {
      this.#gl.clearColor(0, 0, 0, 0); // Transparente para mostrar la textura
    } else {
      this.#gl.clearColor(...this.#colorFondo);
    }
    this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT);
    // limpiar al inicio del frame

    // Primero el fondo
    if (this.#texturaFondo) {
      this.#gl.disable(this.#gl.DEPTH_TEST);
      this.#dibujarFondo();
      console.log("Fondo dibujado con textura");
    }

    // Luego los puntos
    if (coordenadas.length > 5) {
      this.#dibujarPuntos(coordenadas);
    } else console.warn("No hay suficientes coordenadas para dibujar");
  }

  /**
   * Reasignar dimensiones en pixeles
   * @param {number} ancho
   * @param {number} alto
   */
  setDimensiones(ancho, alto) {
    if (!this.#redimensionable) {
      throw new Error("Este canvas no se puede redimensionar");
    }
    this.#canvas.width = parseInt(ancho);
    this.#canvas.height = parseInt(alto);

    // Actualizar viewport
    this.#gl.viewport(0, 0, this.#canvas.width, this.#canvas.height);
  }

  /**
   * Cambiar color del fondo
   * @param {hexadecimal} nuevoColor
   */
  setColorFondo(nuevoColor) {
    const color = hexToGlColor(nuevoColor);
    if (color.length == 4) {
      this.#colorFondo = color;
    } else throw new Error("Color inválido");
  }

  /**
   *
   */
  setTexturaFondo(textura, ancho, alto) {
    this.#texturaFondo = textura;

    if (this.#redimensionable) {
      this.#canvas.width = parseInt(ancho);
      this.#canvas.height = parseInt(alto);

      // Actualizar viewport
      this.#gl.viewport(0, 0, this.#canvas.width, this.#canvas.height);
    }
  }
}
