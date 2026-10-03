import { useState } from "react";
import UploadNotaFiscal from "./components/UploadNotaFiscal.jsx";
import FormularioPedido, { criarLinhaPedido } from "./components/FormularioPedido.jsx";
import ResumoComparacao from "./components/ResumoComparacao.jsx";
import TabelaResultado from "./components/TabelaResultado.jsx";
import { compararItens } from "./utils/compararItens.js";

const ETAPAS = [
  { id: "nota", rotulo: "Nota fiscal" },
  { id: "pedido", rotulo: "Pedido" },
  { id: "resultado", rotulo: "Resultado" },
];

function IndiceEtapa({ etapa }) {
  const atual = ETAPAS.findIndex((item) => item.id === etapa);

  return (
    <ol className="mb-6 flex flex-wrap gap-2">
      {ETAPAS.map((item, index) => {
        const ativo = item.id === etapa;
        const concluido = index < atual;
        return (
          <li
            key={item.id}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              ativo
                ? "bg-accent text-white"
                : concluido
                  ? "bg-[#e8f4f2] text-accent"
                  : "bg-white text-ink-soft"
            }`}
          >
            {index + 1}. {item.rotulo}
          </li>
        );
      })}
    </ol>
  );
}

function App() {
  const [etapa, setEtapa] = useState("nota");
  const [nota, setNota] = useState(null);
  const [linhas, setLinhas] = useState(() => [criarLinhaPedido()]);
  const [comparacao, setComparacao] = useState(null);

  function handleNota(notaLida) {
    setNota(notaLida);
    setComparacao(null);
    setEtapa("pedido");
  }

  function handleComparar(itensPedido) {
    setComparacao(compararItens(itensPedido, nota.itens));
    setEtapa("resultado");
  }

  function reiniciar() {
    setNota(null);
    setLinhas([criarLinhaPedido()]);
    setComparacao(null);
    setEtapa("nota");
  }

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="mb-2 font-display text-sm font-semibold tracking-[0.12em] text-accent uppercase">
            Conferência
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">BateNota</h1>
          <p className="mt-1 text-lg text-ink-soft">NF-e contra pedido de compra</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
            Envie o XML da nota, lance o pedido e veja na hora o que confere, o que diverge e o que
            ficou de fora.
          </p>
        </header>

        <IndiceEtapa etapa={etapa} />

        {etapa === "nota" && <UploadNotaFiscal onConcluir={handleNota} />}

        {etapa === "pedido" && nota && (
          <FormularioPedido
            nota={nota}
            linhas={linhas}
            onChange={setLinhas}
            onVoltar={() => setEtapa("nota")}
            onComparar={handleComparar}
          />
        )}

        {etapa === "resultado" && comparacao && (
          <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">Resultado</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  {[nota?.numero ? `Nota nº ${nota.numero}` : null, nota?.emitente || null, nota?.arquivo || null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setEtapa("pedido")}
                  className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-accent"
                >
                  Ajustar pedido
                </button>
                <button
                  type="button"
                  onClick={reiniciar}
                  className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark"
                >
                  Nova conferência
                </button>
              </div>
            </div>

            <ResumoComparacao resumo={comparacao.resumo} />
            <TabelaResultado resultados={comparacao.resultados} />
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
