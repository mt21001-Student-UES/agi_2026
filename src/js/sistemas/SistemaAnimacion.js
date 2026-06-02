/**
 * SistemaAnimacion
 * ----------------
 * Ejecuta las animaciones de efecto (pop-in) de las marcas X/O.
 * Corre ANTES que SistemaRender para que éste ya lea la escala actualizada.
 *
 * Por cada entidad con `animacionEfecto` (activa) + `transform`:
 *   - FASE entrada  : interpola escala 0→1 usando easing cuadrático (ease-out)
 *   - FASE rebote   : oscila ± reboteAmplitud durante reboteDuracion segundos
 *   - FASE completada: desactiva el componente (sin coste en frames siguientes)
 */
export default class SistemaAnimacion {
  constructor(escena) {
    this.escena = escena;
  }

  update(deltaTime) {
    const entidades = this.escena.consultarPorComponente('animacionEfecto');

    for (const entidad of entidades) {
      const anim = entidad.animacionEfecto;
      const tf   = entidad.transform;

      // Si no hay transform o la animación terminó, saltar
      if (!tf || !anim.activa) continue;

      // ── FASE: entrada ─────────────────────────────────────────────────────
      if (anim.fase === 'entrada') {
        anim.progreso += deltaTime / anim.duracion;

        if (anim.progreso >= 1) {
          anim.progreso = 1;
          anim.fase = 'rebote';
          anim.reboteTimer = 0;
        }

        // Easing ease-out cuadrático: t*(2-t) — crece rápido y frena suave
        const t = anim.progreso;
        const easedT = t * (2 - t);
        tf.escala = anim.escalaInicial + (anim.escalaFinal - anim.escalaInicial) * easedT;
      }

      // ── FASE: rebote (intermitente) ───────────────────────────────────────
      else if (anim.fase === 'rebote') {
        anim.reboteTimer += deltaTime;

        if (anim.reboteTimer >= anim.reboteDuracion) {
          // Rebote terminado: fijar escala y desactivar
          tf.escala    = anim.escalaFinal;
          anim.activa  = false;
          anim.fase    = 'completada';
        } else {
          // Oscilación sinusoidal que decae con el tiempo
          const decay = 1 - (anim.reboteTimer / anim.reboteDuracion);
          const freq  = 12; // Hz de la oscilación
          const onda  = Math.sin(anim.reboteTimer * freq * Math.PI * 2);
          tf.escala = anim.escalaFinal + anim.reboteAmplitud * onda * decay;
        }
      }
    }
  }
}
