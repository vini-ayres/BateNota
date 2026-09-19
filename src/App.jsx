import { useState } from 'react'

/** Mock: esperado = OPV, recebido = NF */
const MOCK_ITEMS = [
  { id: 1, descricao: 'Produto A — Caixa kraft 30x20', esperado: 100, recebido: 100, preco: 25 },
  { id: 2, descricao: 'Produto B — Filme stretch 500m', esperado: 40, recebido: 50, preco: 50 },
  { id: 3, descricao: 'Produto C — Etiqueta térmica 100x50', esperado: 30, recebido: 30, preco: 10 },
  { id: 4, descricao: 'Produto D — Palete PBR padrão', esperado: 12, recebido: 12, preco: 30 },
  { id: 5, descricao: 'Produto E — Fita adesiva 45mm', esperado: 80, recebido: 72, preco: 93.75 },
]

function formatMoney(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

function formatUnitPrice(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

function formatSignedMoney(value) {
  const abs = formatMoney(Math.abs(value))
  if (value > 0) return `+${abs}`
  if (value < 0) return `-${abs}`
  return abs
}

function formatDiffUnits(diff) {
  if (diff > 0) return `+${diff} un`
  return `${diff} un`
}

function App() {
  const [xmlFile, setXmlFile] = useState(null)
  const [opv, setOpv] = useState('')
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState('')

  function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setXmlFile(file)
    setResultado(null)
    setErro('')
  }

  function handleConferir(e) {
    e.preventDefault()
    if (!xmlFile) {
      setErro('Selecione o XML da nota fiscal.')
      return
    }
    if (!opv.trim()) {
      setErro('Informe o número da ordem de pedido (OPV).')
      return
    }

    const itens = MOCK_ITEMS.map((item) => {
      const diferenca = item.recebido - item.esperado
      const impacto = diferenca * item.preco
      return {
        ...item,
        ok: diferenca === 0,
        diferenca,
        impacto,
      }
    })

    const conferem = itens.filter((i) => i.ok).length
    const discrepanciaTotal = itens.reduce((sum, i) => sum + Math.abs(i.impacto), 0)

    setErro('')
    setResultado({ itens, conferem, total: itens.length, discrepanciaTotal })
  }

  const tudoOk = resultado && resultado.conferem === resultado.total

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 animate-[fadeUp_0.5s_ease-out]">
          <p className="mb-2 font-display text-sm font-semibold tracking-[0.12em] text-accent uppercase">
            Protótipo
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            BateNota
          </h1>
          <p className="mt-1 text-lg text-ink-soft">Conferência de NF</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
            Cruze o XML da nota fiscal com a ordem de pedido em segundos — sem planilha, sem
            erro de olho.
          </p>
        </header>

        <form
          onSubmit={handleConferir}
          className="mb-6 rounded-2xl border border-line bg-panel p-5 shadow-[0_12px_40px_-20px_rgba(15,42,61,0.35)] sm:p-7 animate-[fadeUp_0.55s_ease-out]"
        >
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">
                XML da nota fiscal
              </label>
              <label className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-surface px-4 py-8 transition hover:border-accent hover:bg-[#e8f4f2]">
                <span className="font-display text-base font-semibold text-ink">
                  {xmlFile ? xmlFile.name : 'Arraste o XML ou clique para enviar'}
                </span>
                <span className="text-xs text-ink-soft">
                  {xmlFile ? 'Arquivo carregado (mock)' : 'NFe-proc.xml · simulação'}
                </span>
                <input
                  type="file"
                  accept=".xml,text/xml,application/xml"
                  className="sr-only"
                  onChange={handleUpload}
                />
              </label>
            </div>

            <div>
              <label htmlFor="opv" className="mb-2 block text-sm font-semibold text-ink">
                Número da OPV
              </label>
              <input
                id="opv"
                type="text"
                value={opv}
                onChange={(e) => {
                  setOpv(e.target.value)
                  setResultado(null)
                }}
                placeholder="Ex: OPV-2026-01482"
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink outline-none transition placeholder:text-[#8aa0ae] focus:border-accent focus:ring-2 focus:ring-[#0d7a6f33]"
              />
            </div>

            {erro && (
              <p className="rounded-lg bg-bad-bg px-3 py-2 text-sm font-medium text-bad">
                {erro}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-accent px-5 py-3.5 font-display text-base font-semibold text-white shadow-[0_8px_24px_-8px_rgba(13,122,111,0.7)] transition hover:bg-accent-dark active:scale-[0.99] sm:w-auto sm:min-w-[180px]"
            >
              Conferir
            </button>
          </div>
        </form>

        {resultado && (
          <section className="animate-[fadeUp_0.4s_ease-out]">
            {tudoOk ? (
              <div className="mb-4 rounded-xl border border-[#b7e4c7] bg-ok-bg px-5 py-4 text-center">
                <p className="font-display text-lg font-semibold text-ok">Tudo OK</p>
                <p className="mt-1 text-sm text-ok">
                  {resultado.conferem} de {resultado.total} itens conferem
                </p>
              </div>
            ) : (
              <div className="mb-4 rounded-xl border-2 border-[#f0a090] bg-gradient-to-br from-[#fff1eb] to-[#fde8e4] px-5 py-5 shadow-[0_8px_28px_-12px_rgba(180,35,24,0.35)]">
                <p className="font-display text-lg font-semibold text-[#b42318]">
                  Divergências encontradas
                </p>
                <p className="mt-1 text-sm font-medium text-[#8a3b32]">
                  {resultado.conferem} de {resultado.total} itens conferem
                  {opv.trim() && (
                    <span className="ml-1 opacity-80">· OPV {opv.trim()}</span>
                  )}
                </p>
                <p className="mt-4 font-display text-xl font-bold tracking-tight text-[#b42318] sm:text-2xl">
                  ⚠️ Discrepância total:{' '}
                  <span className="underline decoration-[#b42318]/40 underline-offset-4">
                    {formatMoney(resultado.discrepanciaTotal)}
                  </span>
                </p>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_12px_40px_-20px_rgba(15,42,61,0.35)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-[#f0f6f9] text-xs tracking-wide text-ink-soft uppercase">
                      <th className="px-4 py-3 font-semibold">Descrição do produto</th>
                      <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                        Qtd. esperada
                      </th>
                      <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                        Qtd. recebida
                      </th>
                      <th className="px-4 py-3 font-semibold text-center">Diferença</th>
                      <th className="px-4 py-3 font-semibold text-left whitespace-nowrap">
                        Impacto financeiro
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.itens.map((item) => (
                      <tr
                        key={item.id}
                        className={
                          item.ok
                            ? 'border-b border-line last:border-0'
                            : 'border-b border-[#f5c2c0] bg-bad-bg last:border-0'
                        }
                      >
                        <td className="px-4 py-3.5 font-medium text-ink">{item.descricao}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-ink-soft whitespace-nowrap">
                          {item.esperado} un
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-ink whitespace-nowrap">
                          {item.recebido} un
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {item.ok ? (
                            <span
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ok-bg text-lg text-ok"
                              title="Confere"
                              aria-label="Confere"
                            >
                              ✓
                            </span>
                          ) : (
                            <span
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg text-bad ring-1 ring-[#f5c2c0]"
                              title={`Diferença: ${formatDiffUnits(item.diferenca)}`}
                              aria-label="Não confere"
                            >
                              ❌
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {item.ok ? (
                            <span className="font-semibold text-ok">✓ OK</span>
                          ) : (
                            <span className="font-bold text-bad tabular-nums">
                              {formatDiffUnits(item.diferenca)} × {formatUnitPrice(item.preco)}
                              /un = {formatSignedMoney(item.impacto)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-3 text-xs text-ink-soft">
              Dados simulados para demonstração · XML e OPV não são processados de verdade.
            </p>
          </section>
        )}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .font-display { font-family: var(--font-display); }
        .text-ink { color: var(--color-ink); }
        .text-ink-soft { color: var(--color-ink-soft); }
        .text-accent { color: var(--color-accent); }
        .text-ok { color: var(--color-ok); }
        .text-bad { color: var(--color-bad); }
        .bg-panel { background-color: var(--color-panel); }
        .bg-surface { background-color: var(--color-surface); }
        .bg-accent { background-color: var(--color-accent); }
        .bg-ok-bg { background-color: var(--color-ok-bg); }
        .bg-bad-bg { background-color: var(--color-bad-bg); }
        .border-line { border-color: var(--color-line); }
        .hover\\:bg-accent-dark:hover { background-color: var(--color-accent-dark); }
        .hover\\:border-accent:hover { border-color: var(--color-accent); }
        .focus\\:border-accent:focus { border-color: var(--color-accent); }
      `}</style>
    </div>
  )
}

export default App
