import { formatBRL, formatDiffBRL, formatDiffQtd, formatQtd } from "../utils/format.js";

const ESTILO = {
  ok: {
    linha: "border-green-400 bg-green-50",
    selo: "bg-green-100 text-green-800",
    rotulo: "OK",
  },
  divergente: {
    linha: "border-yellow-400 bg-yellow-50",
    selo: "bg-yellow-100 text-yellow-900",
    rotulo: "Divergente",
  },
  faltante: {
    linha: "border-red-400 bg-red-50",
    selo: "bg-red-100 text-red-800",
    rotulo: "Faltante",
  },
  excedente: {
    linha: "border-red-400 bg-red-50",
    selo: "bg-red-100 text-red-800",
    rotulo: "Excedente",
  },
};

function rotuloCriterio(item) {
  if (item.criterio === "descricao") return "Casado pela descrição";
  if (item.criterio === "codigo") return "Casado pelo código";
  if (item.status === "faltante") return "No pedido, ausente na nota";
  if (item.status === "excedente") return "Na nota, ausente no pedido";
  return "";
}

function CelulaDiff({ valor, formatar }) {
  if (valor == null || Number(valor) === 0) {
    return <span className="text-ink-soft">—</span>;
  }
  const negativo = Number(valor) < 0;
  return (
    <span className={`font-semibold tabular-nums ${negativo ? "text-red-800" : "text-yellow-900"}`}>
      {formatar(valor)}
    </span>
  );
}

function Descricao({ item }) {
  const notaDiferente =
    item.descricaoNota &&
    item.descricao &&
    item.descricaoNota.localeCompare(item.descricao, "pt-BR", { sensitivity: "accent" }) !== 0;

  return (
    <div>
      <p className="font-medium text-ink">{item.descricao || "Sem descrição"}</p>
      {notaDiferente && (
        <p className="mt-0.5 text-xs text-ink-soft">Na nota: {item.descricaoNota}</p>
      )}
      <p className="mt-0.5 text-xs text-ink-soft">{rotuloCriterio(item)}</p>
    </div>
  );
}

function CartaoItem({ item }) {
  const estilo = ESTILO[item.status];

  return (
    <article className={`rounded-xl border p-4 ${estilo.linha}`}>
      <div className="flex items-start justify-between gap-3">
        <Descricao item={item} />
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${estilo.selo}`}>
          {estilo.rotulo}
        </span>
      </div>
      <p className="mt-2 text-xs font-medium text-ink-soft">Código {item.codigo || "—"}</p>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-ink-soft">Qtd. pedido</dt>
          <dd className="tabular-nums text-ink">{formatQtd(item.quantidadePedido)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">Qtd. nota</dt>
          <dd className="tabular-nums text-ink">{formatQtd(item.quantidadeNota)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">Dif. quantidade</dt>
          <dd>
            <CelulaDiff valor={item.diferencaQuantidade} formatar={formatDiffQtd} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">Dif. valor</dt>
          <dd>
            <CelulaDiff valor={item.diferencaValor} formatar={formatDiffBRL} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">Valor un. pedido</dt>
          <dd className="tabular-nums text-ink">{formatBRL(item.valorUnitarioPedido)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">Valor un. nota</dt>
          <dd className="tabular-nums text-ink">{formatBRL(item.valorUnitarioNota)}</dd>
        </div>
      </dl>
    </article>
  );
}

export default function TabelaResultado({ resultados }) {
  return (
    <section aria-label="Itens comparados">
      <div className="space-y-3 md:hidden">
        {resultados.map((item) => (
          <CartaoItem key={item.id} item={item} />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_12px_40px_-20px_rgba(15,42,61,0.35)] md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="bg-[#f0f6f9] text-xs tracking-wide text-ink-soft uppercase">
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Código</th>
                <th className="px-3 py-3 font-semibold">Descrição</th>
                <th className="px-3 py-3 text-right font-semibold">Qtd. pedido</th>
                <th className="px-3 py-3 text-right font-semibold">Qtd. nota</th>
                <th className="px-3 py-3 text-right font-semibold">Dif. qtd</th>
                <th className="px-3 py-3 text-right font-semibold">Valor un. pedido</th>
                <th className="px-3 py-3 text-right font-semibold">Valor un. nota</th>
                <th className="px-3 py-3 text-right font-semibold">Dif. valor</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((item) => {
                const estilo = ESTILO[item.status];
                return (
                  <tr key={item.id} className={estilo.linha}>
                    <td className={`border-t border-b border-l-4 px-3 py-3 ${estilo.linha}`}>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${estilo.selo}`}>
                        {estilo.rotulo}
                      </span>
                    </td>
                    <td className={`border-t border-b px-3 py-3 font-medium text-ink ${estilo.linha}`}>
                      {item.codigo || "—"}
                    </td>
                    <td className={`border-t border-b px-3 py-3 ${estilo.linha}`}>
                      <Descricao item={item} />
                    </td>
                    <td className={`border-t border-b px-3 py-3 text-right tabular-nums text-ink ${estilo.linha}`}>
                      {formatQtd(item.quantidadePedido)}
                    </td>
                    <td className={`border-t border-b px-3 py-3 text-right tabular-nums text-ink ${estilo.linha}`}>
                      {formatQtd(item.quantidadeNota)}
                    </td>
                    <td className={`border-t border-b px-3 py-3 text-right ${estilo.linha}`}>
                      <CelulaDiff valor={item.diferencaQuantidade} formatar={formatDiffQtd} />
                    </td>
                    <td className={`border-t border-b px-3 py-3 text-right tabular-nums text-ink ${estilo.linha}`}>
                      {formatBRL(item.valorUnitarioPedido)}
                    </td>
                    <td className={`border-t border-b px-3 py-3 text-right tabular-nums text-ink ${estilo.linha}`}>
                      {formatBRL(item.valorUnitarioNota)}
                    </td>
                    <td className={`border-t border-b border-r px-3 py-3 text-right ${estilo.linha}`}>
                      <CelulaDiff valor={item.diferencaValor} formatar={formatDiffBRL} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-soft">
        Diferença de quantidade = quantidade da nota − quantidade do pedido. Diferença de valor =
        total da linha na nota − total da linha no pedido.
      </p>
    </section>
  );
}
