import { formatBRL } from "../utils/format.js";

const CARDS = [
  { chave: "totalItens", rotulo: "Total de itens", classe: "border-line bg-panel" },
  { chave: "ok", rotulo: "OK", classe: "border-green-400 bg-green-50" },
  { chave: "divergentes", rotulo: "Divergentes", classe: "border-yellow-400 bg-yellow-50" },
  { chave: "faltantes", rotulo: "Faltantes", classe: "border-red-400 bg-red-50" },
  { chave: "excedentes", rotulo: "Excedentes", classe: "border-red-400 bg-red-50" },
];

export default function ResumoComparacao({ resumo }) {
  const semDivergencia = resumo.divergenciaTotal === 0;

  return (
    <section aria-label="Resumo da comparação">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {CARDS.map((card) => (
          <div key={card.chave} className={`rounded-2xl border p-4 ${card.classe}`}>
            <dt className="text-xs font-semibold tracking-wide text-ink-soft uppercase">{card.rotulo}</dt>
            <dd className="mt-1 font-display text-2xl font-bold text-ink">{resumo[card.chave]}</dd>
          </div>
        ))}
        <div
          className={`col-span-2 rounded-2xl border p-4 lg:col-span-1 ${
            semDivergencia ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"
          }`}
        >
          <dt className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Divergência total</dt>
          <dd className="mt-1 font-display text-xl font-bold text-ink sm:text-2xl">{formatBRL(resumo.divergenciaTotal)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-ink-soft">
        A divergência total soma, em módulo, a diferença de valor de cada linha divergente, faltante ou
        excedente. Um item fica OK quando a quantidade e o valor unitário são iguais.
      </p>
    </section>
  );
}
