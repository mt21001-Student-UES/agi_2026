import ModeloCirculoDDA from "../control/modeloCirculoDDA.js";

const canvas = document.getElementById("canvas");
var modeloCirculo = new ModeloCirculoDDA(canvas, true);
modeloCirculo.setResolucion(100, 10);

var colorPunto = document.getElementById("btnColorPunto");
var colorFondo = document.getElementById("btnColorFondo");

function actualizarCirculo() {
  const resolucionLinea = parseInt(
    document.getElementById("inputResolucionLinea").value,
    10
  );
  const resolucionCirculo = parseInt(
    document.getElementById("inputResolucionCirculo").value,
    10
  );
  const radioCirculo = parseFloat(
    document.getElementById("inputRadioCirculo").value,
    10
  );
  modeloCirculo.setResolucion(resolucionLinea, resolucionCirculo, radioCirculo);
}

// --- Eventos ---

document
  .getElementById("inputResolucionLinea")
  .addEventListener("input", () => {
    actualizarCirculo();
  });

document
  .getElementById("inputResolucionCirculo")
  .addEventListener("input", () => {
    actualizarCirculo();
  });

document.getElementById("inputRadioCirculo").addEventListener("input", () => {
  actualizarCirculo();
});

document
  .getElementById("btnActualizarCirculo")
  .addEventListener("click", () => {
    actualizarCirculo();
  });

// --- Canvas y Puntos ---

colorFondo.addEventListener("input", (e) => {
  modeloCirculo.setColorFondo(e.target.value); // ej: "#ff0000"
});

colorPunto.addEventListener("input", (e) => {
  modeloCirculo.setColorPunto(e.target.value); // ej: "#ff0000"
  actualizarCirculo();
});

document.getElementById("tamañoPunto").addEventListener("change", (e) => {
  modeloCirculo.setTamañoPunto(e.target.value);
});

document.getElementById("btnLimpiarCanvas").addEventListener("click", () => {
  modeloCirculo.borrarCoordenadas();
});

document
  .getElementById("btnActualizarDimensiones")
  .addEventListener("click", () => {
    const nuevoAncho = parseInt(
      document.getElementById("inputAncho").value,
      10
    );
    const nuevoAlto = parseInt(document.getElementById("inputAlto").value, 10);
    modeloCirculo.setDimensiones(nuevoAncho, nuevoAlto);
  });
