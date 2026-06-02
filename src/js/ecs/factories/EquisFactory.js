import EntidadFactory from "../EntidadFactory.js";
import GeometriaComponent from "../componentes/GeometriaComponent.js";
import { AnimacionEfectoComponent } from "../Componentes.js";

import LetraX from "../../graficos/figuras/letras/letraX.js";

/**
 * EquisFactory
 * ------------
 * Genera la marca X (jugador 1) utilizando la letra X.
 */
export default class EquisFactory extends EntidadFactory {
  constructor(escena, { x = 0, y = 0, size = 0.1, color = [1, 1, 1] } = {}) {
    super(escena, "Equis");

    // 1. Instanciar la figura visual (Bresenham)
    // El tamaño de LetraX está determinado por size, que debería ajustarse al ancho de la celda
    const figuraEquis = new LetraX(
      this.entidad.id,
      { x: 0, y: 0, z: 0 },
      { color: color, tamaño: size, algoritmoLinea: "bresenham" },
    );

    this.escena.agregarComponente(
      this.entidad,
      new GeometriaComponent(figuraEquis),
    );

    // 2. Componente de animación (zoom al aparecer)
    this.escena.agregarComponente(this.entidad, new AnimacionEfectoComponent());

    // 3. Transform en la posición central de la casilla
    this.conTransform(x, y, 0, 0, 0);
    this.conRender("puntos", 4, 10);
  }
}
