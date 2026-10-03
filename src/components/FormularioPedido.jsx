import { useState } from "react";
import { analisarNumero } from "../utils/numeros.js";
import { parsePedidoCsv } from "../utils/parsePedidoCsv.js";
import { formatBRL, formatQtd } from "../utils/format.js";

export function criarLinhaPedido(parcial = {}) {
  return {
    id: parcial.id ?? globalThis.crypto?.randomUUID?.() ?? `linha-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    codigo: parcial.codigo != null ? String(parcial.codigo) : "",
    descricao: parcial.descricao != null ? String(parcial.descricao) : "",
    quantidade:
      parcial.quantidade != null && parcial.quantidade !== "" ? String(parcial.quantidade) : "",
    valorUnitario:
      parcial.valorUnitario != null && parcial.valorUnitario !== ""
        ? String(parcial.valorUnitario)
        : "",
  };
}

function validarLinhas(linhas) {
  const preenchidas = [];

  for (let index = 0; index < linhas.length; index += 1) {
    const linha = linhas[index];
    const vazia = ![linha.codigo, linha.descricao, linha.quantidade, linha.valorUnitario].some((valor) =>
      String(valor).trim(),
    );
    if (vazia) continue;

    const posicao = index + 1;
    if (!linha.codigo.trim() && !linha.descricao.trim()) {
      return { erro: `O item ${posicao} precisa de código ou descrição.` };
    }

    const quantidade = analisarNumero(linha.quantidade);
    const valorUnitario = analisarNumero(linha.valorUnitario);

    if (quantidade == null) {
      return { erro: `Quantidade inválida no item ${posicao}. Use um número, por exemplo 10 ou 2,5.` };
    }
    if (valorUnitario == null) {
      return { erro: `Valor unitário inválido no item ${posicao}. Use um número, por exemplo 15,90.` };
    }
    if (quantidade < 0 || valorUnitario < 0) {
      return { erro: `Quantidade e valor do item ${posicao} precisam ser zero ou positivos.` };
    }

    preenchidas.push({
      codigo: linha.codigo.trim(),
      descricao: linha.descricao.trim(),
      quantidade,
      valorUnitario,
    });
  }

  if (!preenchidas.length) {
    return { erro: "Adicione pelo menos um item ao pedido." };
  }

  return { itens: preenchidas };
}

export default function FormularioPedido({ nota, linhas, onChange, onVoltar, onComparar }) {
  const [erro, setErro] = useState("");

  function atualizar(id, campo, valor) {
    setErro("");
    onChange(linhas.map((linha) => (linha.id === id ? { ...linha, [campo]: valor } : linha)));
  }

  function adicionar() {
    setErro("");
    onChange([...linhas, criarLinhaPedido()]);
  }

  function remover(id) {
    setErro("");
    if (linhas.length === 1) {
      onChange([criarLinhaPedido()]);
      return;
    }
    onChange(linhas.filter((linha) => linha.id !== id));
  }

  async function importarCsv(file) {
    if (!file) return;
    setErro("");

    const nomeCsv = file.name.toLowerCase().endsWith(".csv");
    const tipoCsv = !file.type || /csv|plain|excel|text/.test(file.type);
    if (!nomeCsv && !tipoCsv) {
      setErro("Envie um arquivo .csv.");
      return;
    }

    try {
      const texto = await file.text();
      const itens = parsePedidoCsv(texto);
      onChange(itens.map((item) => criarLinhaPedido(item)));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível ler o CSV.");
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const resultado = validarLinhas(linhas);
    if (resultado.erro) {
      setErro(resultado.erro);
      return;
    }
    setErro("");
    onComparar(resultado.itens);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-line bg-panel p-5 shadow-[0_12px_40px_-20px_rgba(15,42,61,0.35)] sm:p-7"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Pedido de compra</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">
            Informe os itens do pedido ou importe um CSV com as colunas código, descrição,
            quantidade e valor unitário.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-accent">
          Importar CSV
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            className="sr-only"
            aria-label="Importar pedido em CSV"
            onChange={(event) => {
              importarCsv(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      <div className="mt-5 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
        <p className="font-semibold text-ink">Nota carregada{nota.arquivo ? `: ${nota.arquivo}` : ""}</p>
        <p className="mt-1 text-ink-soft">
          {[
            nota.numero ? `Nº ${nota.numero}` : null,
            nota.emitente || null,
            nota.valorNota != null ? formatBRL(nota.valorNota) : null,
            `${nota.itens.length} ${nota.itens.length === 1 ? "item" : "itens"}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <details className="mt-3 rounded-xl border border-line bg-white" open>
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-ink">
          Itens lidos na nota
        </summary>
        <ul className="max-h-56 divide-y divide-line overflow-auto border-t border-line">
          {nota.itens.map((item, index) => (
            <li key={`${item.nItem}-${index}`} className="grid gap-1 px-4 py-2.5 text-sm sm:grid-cols-[7rem_1fr_auto] sm:items-center sm:gap-3">
              <span className="font-medium text-ink">{item.codigo || "—"}</span>
              <span className="text-ink-soft">{item.descricao || "Sem descrição"}</span>
              <span className="tabular-nums text-ink">
                {formatQtd(item.quantidade)} × {formatBRL(item.valorUnitario)}
              </span>
            </li>
          ))}
        </ul>
      </details>

      <div className="mt-6 space-y-3">
        <div className="hidden grid-cols-[minmax(0,8rem)_minmax(0,1fr)_6.5rem_7.5rem_auto] gap-2 px-1 text-xs font-semibold tracking-wide text-ink-soft uppercase sm:grid">
          <span>Código</span>
          <span>Descrição</span>
          <span>Quantidade</span>
          <span>Valor unitário</span>
          <span className="sr-only">Ações</span>
        </div>

        {linhas.map((linha, index) => (
          <div
            key={linha.id}
            className="grid grid-cols-1 gap-2 rounded-xl border border-line bg-surface p-3 sm:grid-cols-[minmax(0,8rem)_minmax(0,1fr)_6.5rem_7.5rem_auto] sm:items-center sm:border-0 sm:bg-transparent sm:p-0"
          >
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-ink-soft sm:sr-only">Código</span>
              <input
                value={linha.codigo}
                onChange={(event) => atualizar(linha.id, "codigo", event.target.value)}
                placeholder="Cód."
                aria-label={`Código do item ${index + 1}`}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-[#0d7a6f33]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-ink-soft sm:sr-only">Descrição</span>
              <input
                value={linha.descricao}
                onChange={(event) => atualizar(linha.id, "descricao", event.target.value)}
                placeholder="Descrição"
                aria-label={`Descrição do item ${index + 1}`}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-[#0d7a6f33]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-ink-soft sm:sr-only">Quantidade</span>
              <input
                value={linha.quantidade}
                onChange={(event) => atualizar(linha.id, "quantidade", event.target.value)}
                inputMode="decimal"
                placeholder="0"
                aria-label={`Quantidade do item ${index + 1}`}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-[#0d7a6f33]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-ink-soft sm:sr-only">Valor unitário</span>
              <input
                value={linha.valorUnitario}
                onChange={(event) => atualizar(linha.id, "valorUnitario", event.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                aria-label={`Valor unitário do item ${index + 1}`}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-[#0d7a6f33]"
              />
            </label>
            <button
              type="button"
              onClick={() => remover(linha.id)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-[#b42318] transition hover:bg-red-50"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={adicionar}
        className="mt-4 rounded-lg border border-dashed border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
      >
        Adicionar item
      </button>

      {erro && (
        <p role="alert" className="mt-4 rounded-lg border border-red-400 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
          {erro}
        </p>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onVoltar}
          className="rounded-xl border border-line px-5 py-3 text-sm font-semibold text-ink transition hover:border-accent"
        >
          Voltar
        </button>
        <button
          type="submit"
          className="rounded-xl bg-accent px-5 py-3 font-display text-base font-semibold text-white shadow-[0_8px_24px_-8px_rgba(13,122,111,0.7)] transition hover:bg-accent-dark"
        >
          Comparar com a nota
        </button>
      </div>
    </form>
  );
}
