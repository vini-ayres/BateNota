const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const quantidade = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

export function formatBRL(valor) {
  if (valor == null || Number.isNaN(Number(valor))) return "—";
  return moeda.format(Number(valor));
}

export function formatQtd(valor) {
  if (valor == null || Number.isNaN(Number(valor))) return "—";
  return quantidade.format(Number(valor));
}

export function formatDiffQtd(valor) {
  if (valor == null || Number.isNaN(Number(valor))) return "—";
  const numero = Number(valor);
  const absoluto = formatQtd(Math.abs(numero));
  if (numero > 0) return `+${absoluto}`;
  if (numero < 0) return `-${absoluto}`;
  return absoluto;
}

export function formatDiffBRL(valor) {
  if (valor == null || Number.isNaN(Number(valor))) return "—";
  const numero = Number(valor);
  const absoluto = formatBRL(Math.abs(numero));
  if (numero > 0) return `+${absoluto}`;
  if (numero < 0) return `-${absoluto}`;
  return absoluto;
}
