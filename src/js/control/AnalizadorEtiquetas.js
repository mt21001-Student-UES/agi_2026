import GridTextService from "./gridTextService.js";
import AlphabetoService from "./alphabetoService.js";
import EscenaService from "../control/Escena.js";
import ModeloWebGL from "../control/modeloWebGL.js";

export default class AnalizadorEtiquetas {
  constructor(canvasAnalisis) {
    this.canvas = canvasAnalisis;
    this.modelo = new ModeloWebGL(this.canvas, { tamañoPunto: 3 });
    this.escena = new EscenaService();
    this.alphabeto = new AlphabetoService(this.escena);
    this.modelo.cargarImagenComoTextura("../../img/datset_fondo.jpeg");
  }

  // Recolecta todas las etiquetas guardadas en localStorage
  // Recolecta etiquetas de todas o de un subconjunto de imágenes
  recolectar({ imagenes = null } = {}) {
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key.startsWith("etiquetas:")) continue;

      const nombreArchivo = key.replace("etiquetas:", "");

      // Si se pasó filtro y este archivo no está en la lista → saltar
      if (imagenes && !imagenes.includes(nombreArchivo)) continue;

      const data = JSON.parse(localStorage.getItem(key));

      if (data.cuadros && Array.isArray(data.cuadros)) {
        data.cuadros.forEach((e) => {
          if (e.texto) items.push(e.texto);
        });
      }
    }
    return items;
  }

  // Calcula frecuencia de palabras
  analizar({ porPalabra = true, imagenes = null } = {}) {
    const items = this.recolectar({ imagenes });
    console.log("Etiquetas recolectadas:", items);
    const map = new Map();

    items.forEach((txt) => {
      const tokens = porPalabra ? txt.split(/\s+/) : [txt];
      tokens.forEach((tok) => {
        if (!tok) return;
        const key = tok.toLowerCase();
        map.set(key, (map.get(key) || 0) + 1);
      });
    });

    const maxFreq = Math.max(...map.values());
    this.results = Array.from(map.entries()).map(([texto, freq]) => ({
      texto,
      freq,
      score: freq / maxFreq,
    }));
  }

  listarImagenesDisponibles() {
    const imagenes = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key.startsWith("etiquetas:")) continue;
      const nombreArchivo = key.replace("etiquetas:", "");
      imagenes.push(nombreArchivo);
    }
    return imagenes;
  }

  // Renderiza en el segundo canvas
  render() {
    // Limpia todas las figuras previas
    this.escena.limpiar();

    // Construir array de palabras con tamaño dinámico
    const items = this.results
      .sort((a, b) => b.score - a.score)
      .map((item) => ({
        texto: item.texto,
        anchoBase: 0.005 + item.score * 0.05,
      }));

    // Crear grid y calcular posiciones
    const grid = new GridTextService({
      factorAltura: 1,
      espaciadoLetras: 0.0,
      espaciadoFilas: 0.05,
    });

    const posiciones = grid.calcularPosicionesMulti(items, {
      x0: -0.37,
      y0: -0.75,
      x1: 0.38,
      y1: 0.5,
    });
    //console.log("Posiciones calculadas:", posiciones);

    // Aquí ya no recalculas, solo dibujas
    this.alphabeto.setGrid(grid);
    this.alphabeto.dibujarPosiciones(posiciones);

    this.modelo.dibujar(this.escena.getRender());
  }
}
