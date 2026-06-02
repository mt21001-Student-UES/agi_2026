import EntidadFactory from "../EntidadFactory.js";
import GeometriaComponent from "../componentes/GeometriaComponent.js";
import { AnimacionEfectoComponent } from "../Componentes.js";

import LetraO from "../../graficos/figuras/letras/letraO.js";
import Circulo from "../../graficos/figuras/Circulo.js";

/**
 * CeroFactory
 * -----------
 * Genera la marca O (jugador 2) utilizando la letra O.
 */
export default class CeroFactory extends EntidadFactory {
  constructor(escena, { x = 0, y = 0, size = 0.1, color = [1, 1, 1] } = {}) {
    super(escena, "Cero");

    // Instanciar la figura visual
    // Usando letra en vez de circulo porque falta refactorizar el factory de circulos
    const figuraCero = new LetraO(
      this.entidad.id,
      { x: 0, y: 0, z: 0 },
      { tamaño: size, color: color, algoritmoCirculo: "bresenham" },
    );

    this.escena.agregarComponente(
      this.entidad,
      new GeometriaComponent(figuraCero),
    );

    // Animación
    this.escena.agregarComponente(this.entidad, new AnimacionEfectoComponent());

    // Posición y render
    this.conTransform(x, y, 0, 0, 0);
    this.conRender("puntos", 4, 10);
  }
}
