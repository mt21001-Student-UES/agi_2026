import LetraA from "../Figuras/letras/letraA.js";
import LetraB from "../Figuras/letras/letraB.js";
import LetraC from "../Figuras/letras/letraC.js";
import LetraD from "../Figuras/letras/letraD.js";
import LetraE from "../Figuras/letras/letraE.js";
import LetraF from "../Figuras/letras/letraF.js";
import LetraG from "../Figuras/letras/letraG.js";
import LetraH from "../Figuras/letras/letraH.js";
import LetraI from "../Figuras/letras/letraI.js";
import LetraJ from "../Figuras/letras/letraJ.js";
import LetraK from "../Figuras/letras/letraK.js";
import LetraL from "../Figuras/letras/letraL.js";
import LetraM from "../Figuras/letras/letraM.js";
import LetraN from "../Figuras/letras/letraN.js";
import LetraO from "../Figuras/letras/letraO.js";
import LetraP from "../Figuras/letras/letraP.js";
import LetraQ from "../Figuras/letras/letraQ.js";
import LetraR from "../Figuras/letras/letraR.js";
import LetraS from "../Figuras/letras/letraS.js";
import LetraT from "../Figuras/letras/letraT.js";
import LetraU from "../Figuras/letras/letraU.js";
import LetraV from "../Figuras/letras/letraV.js";
import LetraW from "../Figuras/letras/letraW.js";
import LetraX from "../Figuras/letras/letraX.js";
import LetraY from "../Figuras/letras/letraY.js";
import LetraZ from "../Figuras/letras/letraZ.js";

export default class AlphabetoService {
  #texto = "";
  #grid = [];
  #escena;

  constructor(escena) {
    this.#escena = escena;
  }

  setGrid(grid) {
    //console.log(grid)
    this.#grid = grid;
  }

  setTextoConId(nuevoTexto, id, tamano) {
    const posiciones = this.#grid.calcularPosiciones(nuevoTexto);
    posiciones.forEach((pos) => {
      const figura = this.#obtenerFiguraLetra(pos.letra, pos, tamano);
      if (figura) {
        this.#escena.agregarFigura(figura);
      }
    });
  }

  dibujarPosiciones(posiciones, tamano, idBase = "texto") {
    posiciones.forEach((pos, idx) => {
      const figura = this.#obtenerFiguraLetra(
        pos.letra,
        pos,
        tamano ?? pos.anchoBase / 2,
        `${idBase}_${idx}`
      );
      if (figura) {
        this.#escena.agregarFigura(figura);
      }
    });
  }

  setTexto(nuevoTexto) {
    this.#texto = nuevoTexto;
    const posiciones = this.#grid.calcularPosiciones(this.#texto);
    this.#escena.eliminarFiguraPorId("texto");

    posiciones.forEach((pos) => {
      const figura = this.#obtenerFiguraLetra(pos.letra, pos);
      if (figura) {
        this.#escena.agregarFigura(figura);
      }
    });
  }

  #obtenerFiguraLetra(letra, pos, tamano = null, id = "texto") {
    const tamañoFinal = tamano ?? this.#grid.anchoBase / 2;
    let figura = null;
    switch (letra) {
      case "a":
      case "á":
      case "A":
      case "Á":
        figura = new LetraA(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "A" || letra === "Á",
        });
        break;
      case "b":
      case "B":
        figura = new LetraB(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "B",
        });
        break;
      case "c":
      case "C":
        figura = new LetraC(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "C",
        });
        break;
      case "d":
      case "D":
        figura = new LetraD(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "D",
        });
        break;
      case "e":
      case "é":
      case "E":
      case "É":
        figura = new LetraE(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "E" || letra === "É",
        });
        break;
      case "f":
      case "F":
        figura = new LetraF(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "F",
        });
        break;
      case "g":
      case "G":
        figura = new LetraG(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "G",
        });
        break;
      case "h":
      case "H":
        figura = new LetraH(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "H",
        });
        break;
      case "i":
      case "í":
      case "I":
      case "Í":
        figura = new LetraI(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "I" || letra === "Í",
        });
        break;
      case "j":
      case "J":
        figura = new LetraJ(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "J",
        });
        break;
      case "k":
      case "K":
        figura = new LetraK(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "K",
        });
        break;
      case "l":
      case "L":
        figura = new LetraL(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "L",
        });
        break;
      case "m":
      case "M":
        figura = new LetraM(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "M",
        });
        break;

      case "n":
      case "N":
      case "ñ":
      case "Ñ":
        figura = new LetraN(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "N" || letra === "Ñ",
          virgulilla: letra === "ñ" || letra === "Ñ",
        });
        break;
      case "o":
      case "ó":
      case "O":
      case "Ó":
        figura = new LetraO(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "O" || letra === "Ó",
        });
        break;
      case "p":
      case "P":
        figura = new LetraP(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "P",
        });
        break;
      case "q":
      case "Q":
        figura = new LetraQ(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "Q",
        });
        break;
      case "r":
      case "R":
        figura = new LetraR(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "R",
        });
        break;
      case "s":
      case "S":
        figura = new LetraS(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "S",
        });
        break;
      case "t":
      case "T":
        figura = new LetraT(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "T",
        });
        break;
      case "u":
      case "ú":
      case "U":
      case "Ú":
      case "ü":
      case "Ü":
        figura = new LetraU(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "U" || letra === "Ú" || letra === "Ü",
          dieresis: letra === "ü" || letra === "Ü",
        });
        break;
      case "v":
      case "V":
        figura = new LetraV(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "V",
        });
        break;
      case "w":
      case "W":
        figura = new LetraW(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "W",
        });
        break;
      case "x":
      case "X":
        figura = new LetraX(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "X",
        });
        break;
      case "y":
      case "Y":
        figura = new LetraY(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "Y",
        });
        break;
      case "z":
      case "Z":
        figura = new LetraZ(id, pos, {
          tamaño: tamañoFinal,
          mayuscula: letra === "Z",
        });
        break;
      case " ":
      case "\n":
        figura = null;
        break;
    }
    return figura;
  }
}
