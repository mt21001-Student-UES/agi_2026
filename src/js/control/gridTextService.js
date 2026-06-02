export default class GridTextService {
  #anchoLetra;
  #factorAltura;
  #espaciadoLetras;
  #espaciadoFilas;
  #letrasPermitidas;

  constructor(opciones = {}) {
    this.#anchoLetra = opciones.anchoBase || 0.05;
    this.#factorAltura = opciones.factorAltura || 2.5; // alto = 3 * ancho
    this.#espaciadoLetras = opciones.espaciadoLetras || 0.03;
    this.#espaciadoFilas = opciones.espaciadoFilas || 0.0;

    this.#letrasPermitidas =
      "abcdefghijklmnñopqrstuüvwxyzABCDEFGHIJKLMNÑOPQRSTUÜVWXYZ ".split("");
  }

  /**
   * Acepta array de {texto, anchoBase}
   */
  calcularPosicionesMulti(items, cuadro = { x0: -1, y0: -1, x1: 1, y1: 1 }) {
    const coords = [];
    let cursorX = cuadro.x0;
    let fila = 0;

    for (const item of items) {
      const texto = item.texto
        .split("")
        .filter((c) => this.#letrasPermitidas.includes(c) || c === "\n")
        .join("");

      const anchoLetraBase = item.anchoBase;
      const altoBase = anchoLetraBase * this.#factorAltura;

      for (const letra of texto) {
        if (letra === "\n") {
          fila++;
          cursorX = cuadro.x0;
          continue;
        }

        const anchoLetra =
          letra === " " ? anchoLetraBase * 0.6 : anchoLetraBase;

        if (cursorX + anchoLetra > cuadro.x1) {
          fila++;
          cursorX = cuadro.x0;
        }

        const cx = cursorX + anchoLetra / 2;
        const cy =
          cuadro.y1 - (fila * (altoBase + this.#espaciadoFilas) + altoBase / 2);

        if (cy < cuadro.y0) break;

        coords.push({ x: cx, y: cy, letra, anchoBase: anchoLetraBase });
        cursorX += anchoLetra + this.#espaciadoLetras;
      }

      // Avanzar un poco después de cada palabra
      cursorX += anchoLetraBase * 0.5;
    }

    return coords;
  }

  calcularPosiciones(textoNuevo, cuadro = { x0: -1, y0: -1, x1: 1, y1: 1 }) {
    const texto = textoNuevo
      .split("")
      .filter((c) => this.#letrasPermitidas.includes(c) || c === "\n")
      .join("");

    const coords = [];
    let cursorX = cuadro.x0;
    let fila = 0;
    const altoBase = this.#anchoLetra * this.#factorAltura;

    for (const letra of texto) {
      if (letra === "\n") {
        fila++;
        cursorX = cuadro.x0;
        continue;
      }

      const anchoLetra =
        letra === " " ? this.#anchoLetra * 0.6 : this.#anchoLetra;
      if (cursorX + anchoLetra > cuadro.x1) {
        fila++;
        cursorX = cuadro.x0;
      }

      const cx = cursorX + anchoLetra / 2;
      const cy =
        cuadro.y1 - (fila * (altoBase + this.#espaciadoFilas) + altoBase / 2);

      if (cy < cuadro.y0) break;

      coords.push({ x: cx, y: cy, letra });
      cursorX += anchoLetra + this.#espaciadoLetras;
    }

    return coords;
  }

  get anchoBase() {
    return this.#anchoLetra;
  }
  get factorAltura() {
    return this.#factorAltura;
  }
  get espaciadoLetras() {
    return this.#espaciadoLetras;
  }
  get espaciadoFilas() {
    return this.#espaciadoFilas;
  }
}
