import { analisarNumero } from "./numeros.js";
import { normalizarTexto } from "./compararItens.js";

const COLUNAS = ["codigo", "descricao", "quantidade", "valorUnitario"];

const APELIDOS = new Map([
  ["codigo", "codigo"],
  ["cod", "codigo"],
  ["cprod", "codigo"],
  ["sku", "codigo"],
  ["codigo do produto", "codigo"],
  ["descricao", "descricao"],
  ["xprod", "descricao"],
  ["produto", "descricao"],
  ["descricao do produto", "descricao"],
  ["quantidade", "quantidade"],
  ["qtd", "quantidade"],
  ["qtde", "quantidade"],
  ["qcom", "quantidade"],
  ["valor", "valorUnitario"],
  ["valor unitario", "valorUnitario"],
  ["valorunitario", "valorUnitario"],
  ["vlr unitario", "valorUnitario"],
  ["vuncom", "valorUnitario"],
  ["preco", "valorUnitario"],
  ["preco unitario", "valorUnitario"],
]);

function chaveCabecalho(valor) {
  return normalizarTexto(valor).replace(/\s+/g, " ");
}

function separarLinha(linha, separador) {
  const colunas = [];
  let atual = "";
  let entreAspas = false;

  for (let i = 0; i < linha.length; i += 1) {
    const caractere = linha[i];
    if (caractere === '"') {
      if (entreAspas && linha[i + 1] === '"') {
        atual += '"';
        i += 1;
      } else {
        entreAspas = !entreAspas;
      }
    } else if (caractere === separador && !entreAspas) {
      colunas.push(atual.trim());
      atual = "";
    } else {
      atual += caractere;
    }
  }

  colunas.push(atual.trim());
  return colunas;
}

function detectarSeparador(texto) {
  const amostra = texto.split(/\r?\n/).find((linha) => linha.trim()) || "";
  const virgulas = (amostra.match(/,/g) || []).length;
  const pontoEVirgula = (amostra.match(/;/g) || []).length;
  return pontoEVirgula > virgulas ? ";" : ",";
}

function mapearCabecalho(colunas) {
  const mapa = {};
  colunas.forEach((coluna, index) => {
    const apelido = APELIDOS.get(chaveCabecalho(coluna));
    if (apelido && mapa[apelido] == null) mapa[apelido] = index;
  });
  const reconhecidas = COLUNAS.filter((coluna) => mapa[coluna] != null);
  if (reconhecidas.length < 2) return null;
  return mapa;
}

function linhaParaItem(colunas, mapa) {
  const ler = (campo, posicao) => {
    const index = mapa ? mapa[campo] : posicao;
    if (index == null || index >= colunas.length) return "";
    return colunas[index] ?? "";
  };

  const codigo = ler("codigo", 0);
  const descricao = ler("descricao", 1);
  const quantidadeTexto = ler("quantidade", 2);
  const valorTexto = ler("valorUnitario", 3);

  if (![codigo, descricao, quantidadeTexto, valorTexto].some((valor) => String(valor).trim())) {
    return null;
  }

  const quantidade = analisarNumero(quantidadeTexto);
  const valorUnitario = analisarNumero(valorTexto);

  if (quantidade == null || valorUnitario == null) {
    throw new Error(
      `Não foi possível ler quantidade ou valor unitário da linha "${[codigo, descricao].filter(Boolean).join(" — ") || "sem descrição"}".`,
    );
  }

  if (quantidade < 0 || valorUnitario < 0) {
    throw new Error("Quantidade e valor unitário do CSV precisam ser zero ou positivos.");
  }

  return {
    codigo: codigo.trim(),
    descricao: descricao.trim(),
    quantidade,
    valorUnitario,
  };
}

/** Lê CSV de pedido: código, descrição, quantidade, valor unitário. */
export function parsePedidoCsv(texto) {
  const conteudo = String(texto ?? "")
    .replace(/^\uFEFF/, "")
    .trim();

  if (!conteudo) {
    throw new Error("O arquivo CSV está vazio.");
  }

  const separador = detectarSeparador(conteudo);
  const linhas = conteudo
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean)
    .map((linha) => separarLinha(linha, separador));

  if (!linhas.length) {
    throw new Error("O arquivo CSV está vazio.");
  }

  const cabecalho = mapearCabecalho(linhas[0]);
  const dados = cabecalho ? linhas.slice(1) : linhas;
  const itens = dados.map((colunas) => linhaParaItem(colunas, cabecalho)).filter(Boolean);

  if (!itens.length) {
    throw new Error(
      "Nenhum item encontrado no CSV. Use as colunas código, descrição, quantidade e valor unitário.",
    );
  }

  return itens;
}
