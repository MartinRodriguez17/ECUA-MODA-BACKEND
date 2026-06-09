// Archivo: backend/utils/validadorRUC.js

/**
 * Valida un RUC ecuatoriano (Personas Naturales, Sociedades Privadas y Públicas)
 * @param {string} ruc - El RUC de 13 dígitos a validar
 * @returns {boolean} - true si es válido, false si es chimbo
 */

const validarRucEcuador = (ruc) => {
  // 1. Validaciones básicas: que exista, sea texto y tenga exactamente 13 dígitos numéricos
  if (!ruc || typeof ruc !== 'string' || !/^\d{13}$/.test(ruc)) {
    return false;
  }

  // 2. Validar código de provincia (primeros 2 dígitos entre 01 y 24, o 30 para extranjeros)
  const provincia = parseInt(ruc.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return false;
  }

  // 3. Validar los últimos dígitos del establecimiento (no pueden ser 000)
  const establecimiento = ruc.substring(10, 13);
  if (establecimiento === '000') {
    return false;
  }

  // 4. Extraer el tercer dígito para saber qué tipo de RUC es
  const tercerDigito = parseInt(ruc.charAt(2), 10);

  // --- CASO A: SOCIEDADES PRIVADAS O EXTRANJEROS (Tercer dígito = 9) ---
  if (tercerDigito === 9) {
    const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    const digitoVerificador = parseInt(ruc.charAt(9), 10);
    let suma = 0;

    for (let i = 0; i < coeficientes.length; i++) {
      suma += parseInt(ruc.charAt(i), 10) * coeficientes[i];
    }

    const residuo = suma % 11;
    const resultado = residuo === 0 ? 0 : 11 - residuo;
    return resultado === digitoVerificador;
  }

  // --- CASO B: ENTIDADES PÚBLICAS (Tercer dígito = 6) ---
  if (tercerDigito === 6) {
    const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2];
    const digitoVerificador = parseInt(ruc.charAt(8), 10);
    let suma = 0;

    for (let i = 0; i < coeficientes.length; i++) {
      suma += parseInt(ruc.charAt(i), 10) * coeficientes[i];
    }

    const residuo = suma % 11;
    const resultado = residuo === 0 ? 0 : 11 - residuo;
    return resultado === digitoVerificador;
  }

  // --- CASO C: PERSONAS NATURALES (Tercer dígito menor a 6: 0,1,2,3,4,5) ---
  if (tercerDigito < 6) {
    // Es igual al algoritmo de la cédula (Módulo 10) para los primeros 10 dígitos
    const digitoVerificador = parseInt(ruc.charAt(9), 10);
    let suma = 0;

    for (let i = 0; i < 9; i++) {
      let valor = parseInt(ruc.charAt(i), 10);
      if (i % 2 === 0) { // Posiciones impares (0, 2, 4, 6, 8) se multiplican por 2
        valor = valor * 2;
        if (valor > 9) valor -= 9;
      }
      suma += valor;
    }

    const primerDigitoSuma = String(suma).charAt(0);
    const decenaSuperior = (parseInt(primerDigitoSuma, 10) + 1) * 10;
    let resultado = decenaSuperior - suma;
    if (resultado === 10) resultado = 0;

    return resultado === digitoVerificador;
  }

  return false;
};

module.exports = { validarRucEcuador };