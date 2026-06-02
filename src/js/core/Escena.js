/**
 * Escena.js — Núcleo ECS: Gestor de Entidades + Registro de Sistemas
 *
 * Responsabilidades:
 *  1. Ser el "mundo" que contiene todas las entidades activas.
 *  2. Proveer una API para crear, consultar y destruir entidades.
 *  3. Registrar los sistemas que operarán sobre esas entidades.
 *  4. Exponerse al Motor.js como un único objeto orquestador.
 *
 * Relación con el resto del motor:
 *   Motor.js  ──► Escena.update(dt)  ──► Sistema1.update(dt), Sistema2.update(dt)…
 *   Escena también sirve como "gestorEntidades" que los sistemas consultan vía
 *   escena.lista, escena.obtenerEntidad(), escena.consultarPorComponente(), etc.
 */
export default class Escena {
  // ─── Estado interno ───────────────────────────────────────────────────────
  #entidades;      // Map<id, entidad>  – acceso O(1) por ID
  #sistemas;       // Array<Sistema>    – ordenados por prioridad de ejecución
  #contadorIds;    // Contador autoincremental para IDs únicos

  constructor() {
    this.#entidades   = new Map();
    this.#sistemas    = [];
    this.#contadorIds = 0;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SECCIÓN 1 – API DE ENTIDADES
  //  Compatible con SistemaFisicas (espera gestorEntidades.lista)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Crea una entidad vacía y la registra en la escena.
   * @param {string} [nombre] Nombre descriptivo opcional (solo para depuración).
   * @returns {Object} La entidad recién creada.
   */
  crearEntidad(nombre = null) {
    const id = `ent_${this.#contadorIds++}`;
    const entidad = { id, nombre };
    this.#entidades.set(id, entidad);
    return entidad;
  }

  /**
   * Añade (o sobreescribe) un componente en una entidad existente.
   * La clave del componente es su constructor.name en camelCase.
   *
   * Ejemplos de claves generadas:
   *   TransformComponent → 'transform'
   *   GraficoComponent   → 'grafico'
   *   FisicaComponent    → 'fisica'
   *
   * @param {string|Object} entidadOId ID de la entidad o la entidad directamente.
   * @param {Object} componente Instancia del componente a agregar.
   * @returns {Escena} this (encadenamiento fluente).
   */
  agregarComponente(entidadOId, componente) {
    const entidad = this.obtenerEntidadPorId(entidadOId);
    if (!entidad) {
      console.warn(`[Escena] agregarComponente: entidad no encontrada.`, entidadOId);
      return this;
    }

    // Derivar clave semántica desde el nombre de la clase
    // "TransformComponent" → "transform"
    const clave = this.#claveDeComponente(componente.constructor.name);
    entidad[clave] = componente;
    return this;
  }

  /**
   * Elimina un componente de una entidad.
   * @param {string|Object} entidadOId
   * @param {Function} ClaseComponente La clase del componente (ej: TransformComponent).
   * @returns {Escena} this
   */
  quitarComponente(entidadOId, ClaseComponente) {
    const entidad = this.obtenerEntidadPorId(entidadOId);
    if (!entidad) return this;
    const clave = this.#claveDeComponente(ClaseComponente.name);
    delete entidad[clave];
    return this;
  }

  /**
   * Registra una entidad ya construida externamente (ej: desde una Factory).
   * @param {Object} entidad Objeto con al menos una propiedad `id`.
   * @returns {Escena} this
   */
  registrarEntidad(entidad) {
    if (!entidad?.id) {
      console.warn("[Escena] registrarEntidad: la entidad no tiene 'id'.", entidad);
      return this;
    }
    this.#entidades.set(entidad.id, entidad);
    return this;
  }

  /**
   * Elimina una entidad de la escena por su ID.
   * @param {string} id
   */
  destruirEntidad(id) {
    this.#entidades.delete(id);
  }

  /**
   * Obtiene una entidad por su ID.
   * @param {string} id
   * @returns {Object|undefined}
   */
  obtenerEntidadPorId(entidadOId) {
    if (typeof entidadOId === 'string') {
      return this.#entidades.get(entidadOId);
    }
    if (typeof entidadOId === 'object' && entidadOId?.id) {
      return this.#entidades.get(entidadOId.id) ?? entidadOId;
    }
    return undefined;
  }

  /**
   * Obtiene una entidad por su nombre.
   * @param {string} nombre
   * @returns {Object|undefined}
   */
  obtenerEntidadPorNombre(nombre) {
    for (const entidad of this.#entidades.values()) {
      if (entidad.nombre === nombre) {
        return entidad;
      }
    }
    return undefined;
  }


  /**
   * Devuelve todas las entidades que posean TODOS los componentes indicados.
   * Muy útil para que los sistemas filtren solo lo que les importa.
   *
   * @param {...string} claves Nombres de componente en camelCase ('transform', 'grafico', …)
   * @returns {Object[]} Array de entidades coincidentes.
   *
   * @example
   *   const renderizables = escena.consultarPorComponente('transform', 'grafico');
   */
  consultarPorComponente(...claves) {
    const resultado = [];
    for (const entidad of this.#entidades.values()) {
      if (claves.every(c => entidad[c] !== undefined)) {
        resultado.push(entidad);
      }
    }
    return resultado;
  }

  /**
   * Propiedad de solo lectura.
   * Expone las entidades como Array para que los sistemas puedan iterar.
   * Compatible con la API esperada por SistemaFisicas: gestorEntidades.lista
   * @returns {Object[]}
   */
  get lista() {
    return [...this.#entidades.values()];
  }

  /**
   * Número total de entidades registradas.
   * @returns {number}
   */
  get totalEntidades() {
    return this.#entidades.size;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SECCIÓN 2 – API DE SISTEMAS
  //  Delega en Motor.js el tick, pero Escena puede actuar como orquestador
  //  intermedio si se usa sin Motor (útil para tests).
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Registra un sistema en el pipeline de la escena.
   * El orden de registro determina el orden de ejecución (Input → Física → Render).
   *
   * @param {Object} sistema Objeto con un método `update(deltaTime)`.
   * @returns {Escena} this
   */
  agregarSistema(sistema) {
    if (typeof sistema?.update !== 'function') {
      console.warn('[Escena] agregarSistema: el sistema debe tener un método update().', sistema);
      return this;
    }
    this.#sistemas.push(sistema);
    return this;
  }

  /**
   * Elimina un sistema del pipeline por referencia.
   * @param {Object} sistema
   */
  quitarSistema(sistema) {
    const idx = this.#sistemas.indexOf(sistema);
    if (idx !== -1) this.#sistemas.splice(idx, 1);
  }

  /**
   * Ejecuta el update de TODOS los sistemas registrados.
   * Motor.js llamará a este método en cada frame:
   *   motor.agregarSistema(escena)  →  escena.update(deltaTime)
   *
   * También puede usarse de forma autónoma (sin Motor) para pruebas.
   * @param {number} deltaTime Tiempo transcurrido en segundos desde el último frame.
   */
  update(deltaTime) {
    for (const sistema of this.#sistemas) {
      sistema.update(deltaTime);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SECCIÓN 3 – UTILIDADES PRIVADAS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Convierte el nombre de una clase de componente en una clave camelCase
   * eliminando el sufijo "Component" o "Componente".
   *
   * TransformComponent → 'transform'
   * GraficoComponent   → 'grafico'
   * FisicaComponent    → 'fisica'
   * MiDato             → 'miDato'    (sin sufijo, se pasa tal cual en camelCase)
   *
   * @param {string} nombreClase
   * @returns {string}
   */
  #claveDeComponente(nombreClase) {
    const sinSufijo = nombreClase
      .replace(/Component$/, '')
      .replace(/Componente$/, '');

    // Convertir primera letra a minúscula
    return sinSufijo.charAt(0).toLowerCase() + sinSufijo.slice(1);
  }
}
