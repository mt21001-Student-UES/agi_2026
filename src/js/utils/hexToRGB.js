/**
 *
 * @param {hexadecimal} hex Color en hexadecimal ejemplo: #FFFFFF
 * @returns {Array} Arrays de valores en RGB + alpha
 */
function hexToGlColor(hex) {
  const regexHexa = /^#[0-9A-Fa-f]{6}$/;
  if (regexHexa.test(hex)) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    return [r, g, b, 1.0]; // Devuelve [r, g, b, a]
  } else return [];
}
export default hexToGlColor;
