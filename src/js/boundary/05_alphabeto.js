import ModeloWebGL from "../control/modeloWebGL.js";
import AlphabetoService from "../control/alphabetoService.js";
import EscenaService from "../control/Escena.js";
import Puntos from "../Figuras/Puntos.js";
import GridTextService from "../control/gridTextService.js";

// --- Canvas ---
var canvas = document.getElementById("canvas");
var render = new ModeloWebGL(canvas, { tamañoPunto: 2 });

// --- Escena Config ---

var escena = new EscenaService();
var alphabeto = new AlphabetoService(escena);
const texto = `abcdefghijklmnñopqrstuüvwxyz ABCDEFGHIJKLMNÑOPQRSTUÜVWXYZ`;

// Creamos el servicio con opciones en normalizado
const grid = new GridTextService({});

// Visualizar puntos en la escena
const verGrid = false;
if (verGrid) {
  const posiciones = grid.calcularPosiciones(texto);

  let puntos = [];
  let cajas = [];

  posiciones.forEach((pos) => {
    // cada pos ya está en normalizado [-1,1]
    puntos.push(pos.x, pos.y, 0, 1, 0, 0); // rojo para diferenciar
    const { x0, y0, x1, y1 } = pos.box;
    // dibujar rectángulo como 4 puntos
    const color = {
      r: Math.random(),
      g: Math.random(),
      b: Math.random(),
    };
    cajas.push(x0, y0, 0, color.r, color.g, color.b);
    cajas.push(x1, y0, 0, color.r, color.g, color.b);
    cajas.push(x1, y1, 0, color.r, color.g, color.b);
    cajas.push(x0, y1, 0, color.r, color.g, color.b);
  });
  escena.agregarFigura(new Puntos("Grid", puntos));
  escena.agregarFigura(new Puntos("Cajas de letras", cajas));
}

// Asignamos el grid al alfabeto
alphabeto.setGrid(grid);

// --- Presentación ---
// solo renderiza una vez
alphabeto.setTexto(texto);
render.dibujar(escena.getRender());
console.log(escena.getFiguras());

// --- Eventos ---
var inputTexto = document.getElementById("inputTexto");
var btnTexto = document.getElementById("btnTexto");

btnTexto.addEventListener("click", () => {
  alphabeto.setTexto(inputTexto.value);
  render.dibujar(escena.getRender());
  console.log("Letras: ", escena.getFiguras());
});
