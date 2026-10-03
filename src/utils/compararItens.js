import { arredondarCentavos, arredondarQuantidade } from "./numeros.js";

const LIMIAR_SIMILARIDADE = 0.6;

export function normalizarTexto(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function chaveCodigo(codigo) {
  const base = String(codigo ?? "").trim().toLowerCase();
  if (!base) return "";
  if (/^\d+$/.test(base)) return base.replace(/^0+/, "") || "0";
  return base;
}

function comoNumero(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function quaseIgual(a, b) {
  return Math.abs(a - b) < 0.0001;
}

function similaridade(textoA, textoB) {
  if (!textoA || !textoB) return 0;
  if (textoA === textoB) return 1;

  const menor = textoA.length < textoB.length ? textoA : textoB;
  const maior = textoA.length < textoB.length ? textoB : textoA;
  if (menor.length >= 8 && maior.includes(menor) && menor.length / maior.length >= 0.5) {
    return 0.85;
  }

  const tokensA = [...new Set(textoA.split(" ").filter((parte) => parte.length > 2))];
  const tokensB = [...new Set(textoB.split(" ").filter((parte) => parte.length > 2))];
  if (!tokensA.length || !tokensB.length) return 0;

  const conjuntoB = new Set(tokensB);
  let intersecao = 0;
  for (const token of tokensA) {
    if (conjuntoB.has(token)) intersecao += 1;
  }
  const uniao = new Set([...tokensA, ...tokensB]).size;
  return uniao ? intersecao / uniao : 0;
}

function acharPorCodigo(pedido, pool) {
  const chave = chaveCodigo(pedido.codigo);
  if (!chave) return null;
  return pool.find((entrada) => !entrada.usado && chaveCodigo(entrada.item.codigo) === chave) || null;
}

function acharPorDescricao(pedido, pool) {
  const alvo = normalizarTexto(pedido.descricao);
  if (!alvo) return null;

  let melhor = null;
  let melhorScore = LIMIAR_SIMILARIDADE;

  for (const entrada of pool) {
    if (entrada.usado) continue;
    const score = similaridade(alvo, normalizarTexto(entrada.item.descricao));
    if (score >= melhorScore && (melhor === null || score > melhorScore)) {
      melhor = entrada;
      melhorScore = score;
    }
  }

  return melhor;
}

function totalPedido(pedido) {
  return arredondarCentavos(comoNumero(pedido.quantidade) * comoNumero(pedido.valorUnitario));
}

function totalNota(nota) {
  if (nota.valorTotal != null && nota.valorTotal !== "") {
    return arredondarCentavos(comoNumero(nota.valorTotal));
  }
  return arredondarCentavos(comoNumero(nota.quantidade) * comoNumero(nota.valorUnitario));
}

function montarCasado(pedido, nota, criterio, index) {
  const quantidadePedido = comoNumero(pedido.quantidade);
  const quantidadeNota = comoNumero(nota.quantidade);
  const valorUnitarioPedido = comoNumero(pedido.valorUnitario);
  const valorUnitarioNota = comoNumero(nota.valorUnitario);
  const valorTotalPedido = totalPedido(pedido);
  const valorTotalNota = totalNota(nota);
  const status =
    quaseIgual(quantidadePedido, quantidadeNota) && quaseIgual(valorUnitarioPedido, valorUnitarioNota)
      ? "ok"
      : "divergente";

  return {
    id: `casado-${index}`,
    status,
    criterio,
    codigo: String(pedido.codigo ?? "").trim() || String(nota.codigo ?? "").trim(),
    descricao: String(pedido.descricao ?? "").trim() || String(nota.descricao ?? "").trim(),
    descricaoNota: String(nota.descricao ?? "").trim(),
    nItem: nota.nItem ?? null,
    quantidadePedido,
    quantidadeNota,
    valorUnitarioPedido,
    valorUnitarioNota,
    valorTotalPedido,
    valorTotalNota,
    diferencaQuantidade: status === "ok" ? 0 : arredondarQuantidade(quantidadeNota - quantidadePedido),
    diferencaValor: status === "ok" ? 0 : arredondarCentavos(valorTotalNota - valorTotalPedido),
  };
}

function montarFaltante(pedido, index) {
  const quantidadePedido = comoNumero(pedido.quantidade);
  const valorUnitarioPedido = comoNumero(pedido.valorUnitario);
  const valorTotalPedido = totalPedido(pedido);

  return {
    id: `faltante-${index}`,
    status: "faltante",
    criterio: null,
    codigo: String(pedido.codigo ?? "").trim(),
    descricao: String(pedido.descricao ?? "").trim(),
    descricaoNota: "",
    nItem: null,
    quantidadePedido,
    quantidadeNota: null,
    valorUnitarioPedido,
    valorUnitarioNota: null,
    valorTotalPedido,
    valorTotalNota: null,
    diferencaQuantidade: arredondarQuantidade(-quantidadePedido),
    diferencaValor: arredondarCentavos(-valorTotalPedido),
  };
}

function montarExcedente(nota, index) {
  const quantidadeNota = comoNumero(nota.quantidade);
  const valorUnitarioNota = comoNumero(nota.valorUnitario);
  const valorTotalNota = totalNota(nota);

  return {
    id: `excedente-${nota.nItem ?? "s"}-${index}`,
    status: "excedente",
    criterio: null,
    codigo: String(nota.codigo ?? "").trim(),
    descricao: String(nota.descricao ?? "").trim(),
    descricaoNota: String(nota.descricao ?? "").trim(),
    nItem: nota.nItem ?? null,
    quantidadePedido: null,
    quantidadeNota,
    valorUnitarioPedido: null,
    valorUnitarioNota,
    valorTotalPedido: null,
    valorTotalNota,
    diferencaQuantidade: arredondarQuantidade(quantidadeNota),
    diferencaValor: arredondarCentavos(valorTotalNota),
  };
}

function resumir(resultados) {
  const resumo = {
    totalItens: resultados.length,
    ok: 0,
    divergentes: 0,
    faltantes: 0,
    excedentes: 0,
    divergenciaTotal: 0,
  };

  for (const item of resultados) {
    if (item.status === "ok") resumo.ok += 1;
    else if (item.status === "divergente") resumo.divergentes += 1;
    else if (item.status === "faltante") resumo.faltantes += 1;
    else if (item.status === "excedente") resumo.excedentes += 1;

    if (item.status !== "ok") {
      resumo.divergenciaTotal += Math.abs(item.diferencaValor || 0);
    }
  }

  resumo.divergenciaTotal = arredondarCentavos(resumo.divergenciaTotal);
  return resumo;
}

/**
 * Compara itens do pedido com itens da nota.
 * O casamento é feito primeiro pelo código e, se não houver código igual,
 * pela descrição normalizada (minúsculas, sem acento).
 */
export function compararItens(itensPedido = [], itensNota = []) {
  const pool = (itensNota || []).map((item, index) => ({ item, index, usado: false }));

  const casamentos = (itensPedido || []).map((pedido) => {
    const porCodigo = acharPorCodigo(pedido, pool);
    if (porCodigo) {
      porCodigo.usado = true;
      return { pedido, nota: porCodigo.item, criterio: "codigo" };
    }
    return { pedido, nota: null, criterio: null };
  });

  for (const casamento of casamentos) {
    if (casamento.nota) continue;
    const porDescricao = acharPorDescricao(casamento.pedido, pool);
    if (!porDescricao) continue;
    porDescricao.usado = true;
    casamento.nota = porDescricao.item;
    casamento.criterio = "descricao";
  }

  const resultados = casamentos.map((casamento, index) =>
    casamento.nota
      ? montarCasado(casamento.pedido, casamento.nota, casamento.criterio, index)
      : montarFaltante(casamento.pedido, index),
  );

  pool
    .filter((entrada) => !entrada.usado)
    .forEach((entrada, index) => {
      resultados.push(montarExcedente(entrada.item, index));
    });

  return { resultados, resumo: resumir(resultados) };
}
