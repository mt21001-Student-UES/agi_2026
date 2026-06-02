export default class EscenaService {
  #estaticos;
  #dinamicos;

  constructor() {
    this.#estaticos = [];
    this.#dinamicos = [];
  }

  agregarFigura(figura, dinamica = false) {
    if (dinamica) {
      this.#dinamicos.push(figura);
    } else {
      this.#estaticos.push(figura);
    }
  }

  eliminarFiguraPorId(id) {
    this.#estaticos = this.#estaticos.filter((f) => f.id !== id);
    this.#dinamicos = this.#dinamicos.filter((f) => f.id !== id);
  }

  getFiguras() {
    return [...this.#estaticos, ...this.#dinamicos];
  }

  getRender() {
    let frame = [];

    // Estáticos
    for (const figura of this.#estaticos) {
      figura.render();
      //console.log("Buffer de la figura: ", figura.getBuffer())
      frame.push(...figura.getBuffer());
    }

    // Dinámicos
    for (const figura of this.#dinamicos) {
      if (figura.animacion) figura.animacion(figura);
      figura.render();
      frame.push(...figura.getBuffer());
    }

    return frame;
  }

  actualizarFigura(id, callback) {
    // Buscar en estáticos
    let figura = this.#estaticos.find((f) => f.id === id);

    // Si no está, buscar en dinámicos
    if (!figura) {
      figura = this.#dinamicos.find((f) => f.id === id);
    }

    if (figura) {
      console.log("Figura encontrada:", figura);
      if (callback && typeof callback === "function") {
        callback(figura); // aplicar la edición
        figura.render(); // recalcular buffer
      }
    } else {
      console.warn("No se encontró figura con id:", id);
    }
  }

  limpiar() {
    this.#estaticos = [];
    this.#dinamicos = [];
  }
}
