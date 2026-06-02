export function esFormatoValidoImg(nombreArchivo) {
  const extension = nombreArchivo.split(".").pop().toLowerCase();
  return extension === "jpg" || extension === "jpeg" || extension === "png";
}

export function esPotenciaDeDos(valor) {
  return (valor & (valor - 1)) === 0;
}
