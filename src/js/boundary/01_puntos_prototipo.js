import ModeloWebGL from "../control/modeloWebGL.js";

class Puntos extends ModeloWebGL {
  /**
   * Herencia del canvas
   * @param {HTMLCanvasElement} canvas Canvas con las dimensiones iniciales
   * @param {boolean} redimensionable Si se puede cambiar de tamaño
   * @param {Array} fondoColor
   * @param {Array} pointColor
   * @param {number} pointSize
   */
  constructor(canvas, redimensionable, fondoColor, puntoColor, tamañoPunto) {
    super(canvas, redimensionable, fondoColor, puntoColor, tamañoPunto);
  }

  guardarLista(nombre) {
    if (!nombre) {
      alert("Ingrese un nombre válido");
    } else if (this._coordenadas.length === 0) {
      alert("No hay puntos para guardar");
    } else if (localStorage.getItem(nombre)) {
      if (confirm(`La lista "${nombre}" ya existe. ¿Deseas sobrescribirla?`)) {
        localStorage.setItem(nombre, JSON.stringify(this._coordenadas));
        alert("Lista sobrescrita.");
      } else {
        alert("Operación cancelada.");
      }
    } else {
      localStorage.setItem(nombre, JSON.stringify(this._coordenadas));
      alert("Lista Guardada");
    }
  }

  obtenerLista(nombre) {
    if (!localStorage.getItem(nombre)) {
      alert("No existe una lista con ese nombre!");
    } else {
      this._coordenadas = JSON.parse(localStorage.getItem(nombre));
      this.dibujar();
      alert("Lista encontrada");
    }
  }

  borrarLista(nombre) {
    const existe = localStorage.getItem(nombre);
    if (!existe) {
      alert("No existe una lista con ese nombre!");
    } else if (!this._coordenadas) {
      alert("No hay puntos para guardar!");
    } else {
      localStorage.removeItem(nombre);
      alert("Lista Eliminada!");
    }
  }
}

const canvas = document.getElementById("canvas");
const modeloWebgl = new Puntos(canvas, true);

var x = document.getElementById("x");
var y = document.getElementById("y");
var z = document.getElementById("z");
var nombreLista = document.getElementById("nombreLista");

document.getElementById("btnAgregarPunto").addEventListener("click", () => {
  modeloWebgl.agregarPunto(
    parseFloat(x.value),
    parseFloat(y.value),
    parseFloat(z.value)
  );
});

document.getElementById("btnLimpiarCanvas").addEventListener("click", () => {
  modeloWebgl.borrarCoordenadas();
});

document.getElementById("btnBorrarPunto").addEventListener("click", () => {
  modeloWebgl.borrarUltimoPunto();
});

document.getElementById("btnGuardarLista").addEventListener("click", () => {
  modeloWebgl.guardarLista(nombreLista.value);
});

document.getElementById("btnObtenerLista").addEventListener("click", () => {
  modeloWebgl.obtenerLista(nombreLista.value);
});

document.getElementById("btnBorrarLista").addEventListener("click", () => {
  modeloWebgl.borrarLista(nombreLista.value);
});

document.getElementById("btnColorFondo").addEventListener("input", (e) => {
  modeloWebgl.setColorFondo(e.target.value); // ej: "#ff0000"
});

document.getElementById("btnColorPunto").addEventListener("input", (e) => {
  modeloWebgl.setColorPunto(e.target.value); // ej: "#ff0000"
});

document.getElementById("tamañoPunto").addEventListener("change", (e) => {
  modeloWebgl.setTamañoPunto(e.target.value); // ej: "#ff0000"
});

document.getElementById("btnActualizar").addEventListener("click", () => {
  const nuevoAncho = parseInt(document.getElementById("inputAncho").value, 10);
  const nuevoAlto = parseInt(document.getElementById("inputAlto").value, 10);
  modeloWebgl.setDimensiones(nuevoAncho, nuevoAlto);
});

document.getElementById("mostrarListas").addEventListener("click", () => {
  let contenedor = document.getElementById("contenedorListas");
  contenedor.innerHTML = ""; // limpiar antes de mostrar

  for (let i = 0; i < localStorage.length; i++) {
    let clave = localStorage.key(i);
    
    // Crear un bloque para cada lista
    let bloque = document.createElement("div");
    bloque.innerHTML = `<strong>${i + 1} - ${clave}</strong>`;
    contenedor.appendChild(bloque);
  }
});


