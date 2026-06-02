import CuadroConTirantes from "../Figuras/CuadroConTirantes.js";

export default class EtiquetaService extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.canvas = null;
    this.escena = null;
    this.modelo = null;

    // Estado de cuadros
    this.cuadros = [];
    this.cuadroActivo = null;
    this.startCoords = null;

    // Estado de imagenes
    this.imagenes = new Map(); // nombre {src, textura}
    this.listaImagenes = [];
    this.indiceActual = -1;

    this.shadowRoot.innerHTML = `
      <style>
        fieldset { margin: 10px; padding: 10px; }
        ul { list-style: none; padding: 0; }
        li { margin: 6px 0; cursor: pointer; display: flex; align-items: center; }
        li img { width: 40px; height: 40px; object-fit: cover; margin-right: 8px; border: 1px solid #ccc; }
        button { margin: 6px; }
      </style>
      <fieldset>
        <legend>Imagen</legend>
        <input type="file" id="inputImagenes" accept="image/png,image/jpeg" multiple />
        <ul id="listaImagenes"></ul>
      </fieldset>
      <fieldset>
        <legend>Administrar Etiquetas</legend>
        <button id="btnAgregar">Modo Agregar</button>
        <button id="btnRedimensionar">Modo Redimensionar</button>
        <button id="btnEliminar">Eliminar Seleccionada</button>
        <button id="btnGuardar">Guardar Etiquetas</button>
        <input id="texto" placeholder="Texto etiqueta"/>
        <ul id="listaEtiquetas"></ul>
      </fieldset>
  `;
  }

  connectedCallback() {
    // Etiquetas
    this.shadowRoot
      .getElementById("btnAgregar")
      .addEventListener("click", () => this.#setModo("agregar"));
    this.shadowRoot
      .getElementById("btnRedimensionar")
      .addEventListener("click", () => this.#setModo("redimensionar"));
    this.shadowRoot
      .getElementById("btnEliminar")
      .addEventListener("click", () => this.#eliminarActivo());
    this.shadowRoot
      .getElementById("btnGuardar")
      .addEventListener("click", () => this.#guardarEtiquetas());
    this.shadowRoot
      .getElementById("texto")
      .addEventListener("input", (e) => this.#setTextoActivo(e.target.value));

    // Input de imágenes (carga desde directorio)
    this.shadowRoot
      .getElementById("inputImagenes")
      .addEventListener("change", (e) => {
        for (const file of e.target.files) {
          const url = URL.createObjectURL(file);

          this.modelo.cargarImagenComoTextura(
            url,
            (textura, ancho, alto) => {
              // Guardar con file.name como clave
              this.imagenes.set(file.name, { src: url, textura, ancho, alto });

              if (!this.listaImagenes.includes(file.name)) {
                this.listaImagenes.push(file.name);
              }

              this.indiceActual = this.listaImagenes.indexOf(file.name);
              this.#mostrarImagenActual();
            },
            file.name // <-- pasar nombre real
          );
        }
      });

    // Selección desde lista de imágenes ya cargadas
    this.shadowRoot
      .getElementById("listaImagenes")
      .addEventListener("click", (e) => {
        const li = e.target.closest("li");
        if (!li) return;
        const nombre = li.dataset.nombre;
        this.indiceActual = this.listaImagenes.indexOf(nombre);
        this.#mostrarImagenActual();
      });
  }

  #colorUnico(indice) {
    // Paleta básica de 10 colores distintos
    const colores = [
      [1, 0, 0], // rojo
      [0, 1, 0], // verde
      [0, 0, 1], // azul
      [1, 1, 0], // amarillo
      [1, 0, 1], // magenta
      [0, 1, 1], // cian
      [0.5, 0.5, 0], // oliva
      [0.5, 0, 0.5], // púrpura
      [0, 0.5, 0.5], // teal
      [0.3, 0.7, 0.2], // verde claro
    ];
    return colores[indice % colores.length];
  }

  inicializar(escena, modelo, canvas) {
    this.escena = escena;
    this.modelo = modelo;
    this.canvas = canvas;
    this.#initEventosCanvas();
    this.#setModo("agregar");
  }

  #setModo(modo) {
    this.modo = modo;
    this.startCoords = null;
    this.tiradorActivo = null;
    this.esperandoSegundoClick = false;
  }

  #initEventosCanvas() {
    // --- Variables de estado ---
    let arrastrando = false;

    // --- Modo agregar ---
    this.canvas.addEventListener("mousedown", (e) => {
      const coords = this.#normalizar(e);

      if (this.modo === "agregar") {
        this.startCoords = coords;
        arrastrando = true;
      }

      if (this.modo === "redimensionar" && this.cuadroActivo) {
        const indice = this.cuadroActivo.detectarTirador(
          coords.xWebGL,
          coords.yWebGL
        );
        if (indice !== -1) {
          this.tiradorActivo = indice;
          arrastrando = true;
          console.log("Tirador seleccionado:", indice);
        }
      }
    });

    this.canvas.addEventListener("mousemove", (e) => {
      if (!arrastrando) return;
      const coords = this.#normalizar(e);

      if (this.modo === "agregar" && this.startCoords) {
        // Dibujar cuadro provisional mientras arrastras
        const color = this.#colorUnico(this.cuadros.length);
        const provisional = new CuadroConTirantes(
          `Etiqueta ${this.cuadros.length + 1}`,
          this.startCoords.xWebGL,
          this.startCoords.yWebGL,
          coords.xWebGL,
          coords.yWebGL,
          this.canvas,
          color
        );
        provisional.texto = "";
        provisional.render();
        console.log("Dibujando cuadro provisional:", provisional);
        this.modelo.dibujar(this.escena.getRender());
      }

      if (this.modo === "redimensionar" && this.tiradorActivo !== null) {
        this.cuadroActivo.moverTirador(
          this.tiradorActivo,
          coords.xWebGL,
          coords.yWebGL
        );
        this.modelo.dibujar(this.escena.getRender());
      }
    });

    this.canvas.addEventListener("mouseup", (e) => {
      const coords = this.#normalizar(e);

      if (this.modo === "agregar" && this.startCoords) {
        arrastrando = false;

        if (this.cuadros.length >= 10) return;

        if (
          Math.abs(this.startCoords.xWebGL - coords.xWebGL) < 0.03 &&
          Math.abs(this.startCoords.yWebGL - coords.yWebGL) < 0.03
        ) {
          console.warn("Cuadro demasiado pequeño, no se dibuja");
          return;
        }

        const color = this.#colorUnico(this.cuadros.length);
        const nuevo = new CuadroConTirantes(
          `Etiqueta ${this.cuadros.length + 1}`,
          this.startCoords.xWebGL,
          this.startCoords.yWebGL,
          coords.xWebGL,
          coords.yWebGL,
          this.canvas,
          color
        );
        nuevo.texto = "";

        this.cuadros.push(nuevo);
        this.escena.agregarFigura(nuevo);
        this.#renderListaEtiquetas();
        this.modelo.dibujar(this.escena.getRender());

        this.startCoords = null;
        console.log("Cuadro agregado:", nuevo);
      }

      if (this.modo === "redimensionar" && this.tiradorActivo !== null) {
        arrastrando = false;
        console.log("Tirador soltado:", this.tiradorActivo);
        this.tiradorActivo = null;
      }
    });

    // Click derecho = seleccionar cuadro
    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const coords = this.#normalizar(e);

      let cuadroSeleccionado = false;
      for (let i = this.cuadros.length - 1; i >= 0; i--) {
        const c = this.cuadros[i];
        if (c.cuadro.contiene(coords.xWebGL, coords.yWebGL)) {
          this.#seleccionar(c);
          // Cambiar a modo redimensionar
          this.modo = "redimensionar";
          cuadroSeleccionado = true;
          break;
        }
      }

      if (!cuadroSeleccionado) {
        // Si no se selecciona ningún cuadro, deseleccionar el actual y cambiar a modo agregar
        if (this.cuadroActivo) {
          this.cuadroActivo.mostrarTirantes = false;
          this.cuadroActivo.render();
          this.modelo.dibujar(this.escena.getRender());
        }
        this.cuadroActivo = null;
        this.#setModo("agregar");
      }
    });

    this.canvas.addEventListener("imagenCargada", (e) => {
      const { nombre, src, textura, ancho, alto } = e.detail;

      // Guardar referencia completa en mapa interno
      this.imagenes.set(nombre, { src, textura, ancho, alto });

      // Añadir a lista si no existe
      if (!this.listaImagenes.includes(nombre)) {
        this.listaImagenes.push(nombre);
      }

      // Cambiar foco actual
      this.indiceActual = this.listaImagenes.indexOf(nombre);

      // Mostrar imagen actual (ajustará canvas y viewport)
      this.#mostrarImagenActual();

      // Renderizar lista de imágenes
      this.#renderListaImagenes();
    });
  }

  #normalizar(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return {
      xWebGL: (x / this.canvas.width) * 2 - 1,
      yWebGL: -((y / this.canvas.height) * 2 - 1),
    };
  }

  #renderListaEtiquetas() {
    const lista = this.shadowRoot.getElementById("listaEtiquetas");
    lista.innerHTML = "";
    this.cuadros.forEach((c, i) => {
      const li = document.createElement("li");
      li.textContent = `${i + 1} - ${c.texto || "(sin texto)"}`;

      // Convertir color [r,g,b] (0–1) a CSS rgb
      const [r, g, b] = c.color.map((v) => Math.round(v * 255));
      li.style.color = `rgb(${r},${g},${b})`;

      li.addEventListener("click", () => this.#seleccionar(c));
      lista.appendChild(li);
    });
  }

  #renderListaImagenes() {
    const lista = this.shadowRoot.getElementById("listaImagenes");
    lista.innerHTML = "";
    this.listaImagenes.forEach((nombre, i) => {
      const imgData = this.imagenes.get(nombre);
      if (!imgData) return;

      const li = document.createElement("li");
      const thumb = document.createElement("img");
      thumb.src = imgData.src;
      li.appendChild(thumb);

      const span = document.createElement("span");
      span.textContent = nombre + (i === this.indiceActual ? " (actual)" : "");
      li.appendChild(span);

      li.dataset.nombre = nombre;
      li.addEventListener("click", () => {
        this.indiceActual = this.listaImagenes.indexOf(nombre);
        this.#mostrarImagenActual();
      });

      lista.appendChild(li);
    });
  }

  #mostrarImagenActual() {
    const nombre = this.listaImagenes[this.indiceActual];
    const img = this.imagenes.get(nombre);
    if (!img) return;

    // Si ya existe textura → usarla
    if (img.textura) {
      this.modelo.setTexturaFondo(img.textura, img.ancho, img.alto);
      this.modelo.dibujar();
    } else {
      // Si no existe textura aún → cargarla
      this.modelo.cargarImagenComoTextura(img.src, (textura) => {
        img.textura = textura;
        console.log(img);
        this.modelo.setTexturaFondo(textura);
        this.modelo.dibujar();
      });
    }

    // Guardar nombre actual
    this.imagenNombre = nombre;

    // Cargar etiquetas asociadas
    this.#cargarEtiquetas(nombre);

    // Actualizar lista con miniaturas
    this.#renderListaImagenes();
  }

  #setTextoActivo(texto) {
    if (this.cuadroActivo) {
      const palabras = texto.trim().split(/\s+/);
      if (palabras.length > 3) {
        alert("Solo se permiten 3 palabras por etiqueta");
        return;
      }
      this.cuadroActivo.texto = texto;
      this.#renderListaEtiquetas();
      this.modelo.dibujar(this.escena.getRender());
    }
  }

  #seleccionar(cuadro) {
    // Ocultar tirantes del anterior
    if (this.cuadroActivo && this.cuadroActivo !== cuadro) {
      this.cuadroActivo.mostrarTirantes = false;
      this.cuadroActivo.render();
    }

    // Activar nuevo
    this.cuadroActivo = cuadro;
    this.cuadroActivo.mostrarTirantes = true;
    this.cuadroActivo.render();

    // Actualizar el input con el texto del cuadro seleccionado
    const input = this.shadowRoot.getElementById("texto");
    input.value = this.cuadroActivo.texto || "";

    this.modelo.dibujar(this.escena.getRender());
    this.#renderListaEtiquetas();
  }

  #eliminarActivo() {
    if (this.cuadroActivo) {
      this.escena.eliminarFiguraPorId(this.cuadroActivo.id);
      this.cuadros = this.cuadros.filter((c) => c.id !== this.cuadroActivo.id);
      this.cuadroActivo = null;

      // Reasignar colores según nuevo índice
      this.cuadros.forEach((c, i) => {
        const [r, g, b] = this.#colorUnico(i);
        console.log(c);
        c.id = `Etiqueta ${i + 1}`; // <-- reasigna id
        c.setColor(r, g, b);
        c.render();
      });

      this.#renderListaEtiquetas();
      this.modelo.dibujar(this.escena.getRender());
    }
  }

  #guardarEtiquetas() {
    const data = {
      ancho: this.canvas.width,
      alto: this.canvas.height,
      cuadros: this.cuadros.map((c) => c.serializar()),
    };
    localStorage.setItem(
      `etiquetas:${this.imagenNombre}`,
      JSON.stringify(data)
    );
  }

  #cargarEtiquetas(nombreArchivo) {
    // Limpiar estado anterior
    this.cuadros.forEach((c) => this.escena.eliminarFiguraPorId(c.id));
    this.cuadros = [];
    this.cuadroActivo = null;

    // Buscar etiquetas guardadas
    const data = localStorage.getItem(`etiquetas:${nombreArchivo}`);
    if (!data) {
      this.#renderListaEtiquetas();
      this.modelo.dibujar(this.escena.getRender());
      return;
    }

    // Reconstruir cuadros
    console.log("Cargando etiquetas:", JSON.parse(data));
    const etiquetas = JSON.parse(data);
    etiquetas.cuadros.forEach((e, i) => {
      const nuevo = new CuadroConTirantes(
        e.id,
        e.x0,
        e.y0,
        e.x1,
        e.y1,
        this.canvas,
        e.color
      );
      nuevo.texto = e.texto;
      this.cuadros.push(nuevo);
      this.escena.agregarFigura(nuevo);
    });

    // Forzar render inmediato
    this.#renderListaEtiquetas();
    console.log("Etiquetas cargadas: ", this.escena.getFiguras());
    this.modelo.dibujar(this.escena.getRender());
  }
}

customElements.define("etiqueta-service", EtiquetaService);
