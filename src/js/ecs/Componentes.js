/**
 * Componentes.js — Punto de entrada unificado
 * --------------------------------------------
 * Re-exporta todos los componentes desde sus archivos propios.
 * Importa desde aquí para no depender de rutas internas.
 *
 * @example
 *   import { TransformComponent, FisicaComponent } from '../ecs/Componentes.js';
 */
export { default as TransformComponent } from './componentes/TransformComponent.js';
export { default as FisicaComponent    } from './componentes/FisicaComponent.js';
export { default as GeometriaComponent } from './componentes/GeometriaComponent.js';
export { default as RenderComponent    } from './componentes/RenderComponent.js';
export { default as CasillaComponent   } from './componentes/CasillaComponent.js';
export { default as EstadoJuegoComponent} from './componentes/EstadoJuegoComponent.js';
export { default as AnimacionEfectoComponent } from './componentes/AnimacionEfectoComponent.js';