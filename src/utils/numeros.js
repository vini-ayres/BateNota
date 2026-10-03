/** Converte texto com vírgula ou ponto decimal em número. Retorna null se inválido. */
export function analisarNumero(valor) {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : null;
  }

  let texto = String(valor ?? "")
    .trim()
    .replace(/\s/g, "");

  if (!texto) return null;

  if (texto.includes(",") && texto.includes(".")) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else if (texto.includes(",")) {
    texto = texto.replace(",", ".");
  }

  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : null;
}

/** Número de XML de NF-e (ponto decimal). Tag ausente devolve null. */
export function analisarNumeroXml(valor) {
  const texto = String(valor ?? "").trim();
  if (!texto) return null;
  const numero = Number(texto);
  if (!Number.isFinite(numero)) {
    throw new Error("A nota contém um valor numérico inválido e não pôde ser lida.");
  }
  return numero;
}

export function arredondarCentavos(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function arredondarQuantidade(valor) {
  return Math.round((valor + Number.EPSILON) * 10000) / 10000;
}
