import AnalizadorEtiquetas from "../control/AnalizadorEtiquetas.js";

const canvasAnalisis = document.getElementById("canvas");
const analizador = new AnalizadorEtiquetas(canvasAnalisis);

// Llenar el <select> con las imágenes disponibles
const select = document.getElementById("imagenesAnalisis");
const imagenes = analizador.listarImagenesDisponibles();
select.innerHTML = "";
imagenes.forEach((nombre) => {
  const option = document.createElement("option");
  option.value = nombre;
  option.textContent = nombre;
  select.appendChild(option);
});

document.getElementById("btnAnalizar").addEventListener("click", () => {
  const seleccionadas = Array.from(select.selectedOptions).map(
    (opt) => opt.value
  );
  analizador.analizar({ porPalabra: true, imagenes: seleccionadas });
  analizador.render();
});
