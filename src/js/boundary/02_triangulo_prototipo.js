import VertexShaderProvider from "../control/shaders/vertex_shader_provider.js";
import FragmentShaderProvider from "../control/shaders/fragment_shader_provider.js";
class TriangulosModelo {
  /**
   * Instancia para poder dibujar
   * @param {HTMLCanvasElement} canvas Canvas con las dimensiones iniciales
   */
  constructor(canvas) {
    // Guardamos dimensiones del canvas
    this.canvas = canvas;
    this.ancho = canvas.width;
    this.alto = canvas.height; //podemos restringir si queremos
    //contexto
    this.gl = canvas.getContext("webgl");

    // --- Compilación y enlace de shaders ---
    // Obtenemos el código fuente de los shaders
    const vertexShaderSrc = new VertexShaderProvider().threePointShader;
    const fragmentShaderSrc = new FragmentShaderProvider().theFragmentShader;

    // Creamos los objetos shader
    var vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    var fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

    // Asociamos el código fuente
    this.gl.shaderSource(vertexShader, vertexShaderSrc);
    this.gl.shaderSource(fragmentShader, fragmentShaderSrc);

    // Compilamos cada shader
    this.gl.compileShader(vertexShader);
    this.gl.compileShader(fragmentShader);

    // Creamos el programa y adjuntamos los shaders
    this.shaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.shaderProgram, vertexShader);
    this.gl.attachShader(this.shaderProgram, fragmentShader);
    // Enlazamos el programa
    this.gl.linkProgram(this.shaderProgram);

    // --- Validación ---
    // Verificamos que el programa se haya enlazado correctamente
    if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
      alert(
        "Error al enlazar: ",
        this.gl.getProgramInfoLog(this.shaderProgram)
      );
    }

    // Verificar si el shader se haya compilado correctamente
    if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
      alert("Error al compilar: ", this.gl.getShaderInfoLog(vertexShader));
    }

    // Activamos el programa para usarlo, solo puedo tener uno a la vez
    this.gl.useProgram(this.shaderProgram);

    // --- Configuración inicial ---
    // Arreglo para almacenar coordenadas de los puntos (x,y,z)
    this.coordenadas = [];

    // Limpiar el canvas, poner un color
    this.fondoColor = [0.5, 0.5, 0.5, 1.0];
    this.gl.clearColor(...this.fondoColor); //color

    // Color del punto
    const uColor = this.gl.getUniformLocation(this.shaderProgram, "uColor");
    const uPointSize = this.gl.getUniformLocation(
      this.shaderProgram,
      "uPointSize"
    );

    this.gl.uniform4f(uColor, 0.0, 0.0, 0.0, 1.0); // negro
    this.gl.uniform1f(uPointSize, 5.0); // tamaño 10 px

    // Habilitar profundidad, si un punto está abajo no lo va a renderizar
    this.gl.enable(this.gl.DEPTH_TEST);

    // Limpiar el buffer bit (si ya hay algo dibujado, lo borra)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Establecer el viewport, el área de dibujo del canvas
    this.gl.viewport(0, 0, this.ancho, this.alto);
  }

  // Método para agregar un triángulo al arreglo
  agregarTriangulo(x1, y1, z1, x2, y2, z2, x3, y3, z3) {
    if (x1 || y1 || z1 || x2 || y2 || z2 || x3 || y3 || z3) {
      // Agregar coordenadas del triángulo(El orden importa)
      this.coordenadas.push(x1, y1, z1);
      this.coordenadas.push(x2, y2, z2);
      this.coordenadas.push(x3, y3, z3);
      this.dibujar();
    } else {
      alert("Proporcione todas las coordenadas necesarias!");
    }
  }

  // Método para borrar un punto al arreglo
  borrarTriangulo() {
    // Se borra el triángulo(las últimas 9 coordenadas)
    for (let i = 0; i < 9; i++) {
      this.coordenadas.pop();
    }
    // Redibujamos
    this.dibujar();
  }

  // Método para limpiar canvas
  limpiarCanvas() {
    this.coordenadas = [];
    // Limpiar el buffer bit (si ya hay algo dibujado, lo borra)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  // Método para dibujar todos los puntos almacenados
  dibujar() {
    // Limpiar el canvas
    this.gl.clearColor(0.0, 0.0, 0.0, 0.5);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Usar el programa activo
    this.gl.useProgram(this.shaderProgram);

    // --- Buffer de vértices ---
    // Creamos un buffer y lo asociamos(binding) al ARRAY_BUFFER
    const vertex_buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertex_buffer);

    // Cargamos los datos de coordenadas en el buffer
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(this.coordenadas),
      this.gl.STATIC_DRAW
    );

    // --- Atributos del shader ---
    // Obtenemos la ubicación del atributo 'coordenadas' en el vertex shader
    const coordLocation = this.gl.getAttribLocation(
      this.shaderProgram,
      "coordenadas"
    );
    if (coordLocation === -1) {
      console.error("El atributo 'coordenadas' no existe en el shader");
      return;
    }

    // Definimos cómo leer los datos del buffer
    this.gl.vertexAttribPointer(
      coordLocation, // índice del atributo
      3, // número de componentes por vértice (x,y,z)
      this.gl.FLOAT, // tipo de dato
      false, // no normalizado
      0, // stride (0 = consecutivo)
      0 // offset inicial
    );

    // Habilitamos el atributo
    this.gl.enableVertexAttribArray(coordLocation);

    // --- Dibujo ---
    // Dibujamos todos los puntos almacenados
    this.gl.drawArrays(
      this.gl.TRIANGLES, // mode
      0, // first
      this.coordenadas.length / 3 // count
    );
  }

  getCoordenadas() {
    console.log("Coordenadas: ", this.coordenadas);
  }
}

//drawsarray y drawelementarraybuffer, el primero es para dibujar con vertices, el segundo es para dibujar con indices, el segundo es más eficiente porque no repite los vertices, pero el primero es más fácil de entender, para empezar a aprender webgl es mejor usar el primero, después se puede pasar al segundo, pero para este ejemplo vamos a usar el primero, porque es más fácil de entender, aunque no es tan eficiente, pero para este ejemplo no importa tanto la eficiencia, lo importante es entender cómo funciona webgl y cómo se dibujan los puntos en la pantalla.
//no vamos a usar element.
//lo hacemos acá porque no lo vamos a reutilizar
export default triangulosModelo;
var triangulosModelo = new TriangulosModelo(document.getElementById("canvas"));
var x1 = document.getElementById("x1");
var y1 = document.getElementById("y1");
var z1 = document.getElementById("z1");
var x2 = document.getElementById("x2");
var y2 = document.getElementById("y2");
var z2 = document.getElementById("z2");
var x3 = document.getElementById("x3");
var y3 = document.getElementById("y3");
var z3 = document.getElementById("z3");
document.getElementById("btnAgregarTriangulo").addEventListener("click", () => {
  triangulosModelo.agregarTriangulo(
    parseFloat(x1.value),
    parseFloat(y1.value),
    parseFloat(z1.value),
    parseFloat(x2.value),
    parseFloat(y2.value),
    parseFloat(z2.value),
    parseFloat(x3.value),
    parseFloat(y3.value),
    parseFloat(z3.value)
  );
});

document.getElementById("btnLimpiarCanvas").addEventListener("click", () => {
  triangulosModelo.limpiarCanvas();
});

document.getElementById("btnBorrarTriangulo").addEventListener("click", () => {
  triangulosModelo.borrarTriangulo();
});

let triangulo = [0, 0, 0, -0.5, -0.5, 0, 0.5, -0.5, 0];
const paso = 0.01;
let i = 0;
const d = 2.0; // distancia focal para la perspectiva

function proyectar(x, y, z) {
  const xp = x / (z + d);
  const yp = y / (z + d);
  return [xp, yp, z]; // mantenemos z para el depth test
}

function moverTriangulo() {
  // limpiar canvas antes de dibujar
  triangulosModelo.limpiarCanvas();

  // proyectar cada vértice del triángulo
  const [px1, py1, pz1] = proyectar(triangulo[0], triangulo[1], triangulo[2]);
  const [px2, py2, pz2] = proyectar(triangulo[3], triangulo[4], triangulo[5]);
  const [px3, py3, pz3] = proyectar(triangulo[6], triangulo[7], triangulo[8]);

  // dibujar triángulo proyectado
  triangulosModelo.agregarTriangulo(
    px1,
    py1,
    pz1,
    px2,
    py2,
    pz2,
    px3,
    py3,
    pz3
  );

  // actualizar coordenadas para el siguiente paso (alejar en z)
  triangulo[2] -= paso;
  triangulo[5] -= paso;
  triangulo[8] -= paso;

  i++;
  if (i < 150) {
    setTimeout(moverTriangulo, 50);
  } else {
    triangulosModelo.getCoordenadas();
  }
}

// iniciar animación
moverTriangulo();
