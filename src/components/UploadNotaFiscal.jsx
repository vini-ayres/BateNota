import { useState } from "react";
import { parseNFe } from "../utils/parseNFe.js";

const LIMITE_BYTES = 2 * 1024 * 1024;

const ENCODINGS = {
  "utf-8": "utf-8",
  utf8: "utf-8",
  "iso-8859-1": "iso-8859-1",
  "iso8859-1": "iso-8859-1",
  latin1: "iso-8859-1",
  "windows-1252": "windows-1252",
  cp1252: "windows-1252",
};

async function lerConteudoXml(file) {
  const buffer = await file.arrayBuffer();
  const cabeca = new TextDecoder("ascii").decode(buffer.slice(0, 300));
  const encodingDeclarado = cabeca.match(/encoding\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
  const encoding = ENCODINGS[encodingDeclarado] || "utf-8";

  try {
    return new TextDecoder(encoding).decode(buffer);
  } catch {
    return new TextDecoder("utf-8").decode(buffer);
  }
}

export default function UploadNotaFiscal({ onConcluir }) {
  const [erro, setErro] = useState("");
  const [lendo, setLendo] = useState(false);
  const [arrastando, setArrastando] = useState(false);

  async function processarArquivo(file) {
    if (!file) return;

    setErro("");

    if (!file.name.toLowerCase().endsWith(".xml")) {
      setErro("Envie um arquivo com extensão .xml.");
      return;
    }

    if (file.size === 0) {
      setErro("O arquivo XML está vazio.");
      return;
    }

    if (file.size > LIMITE_BYTES) {
      setErro("O arquivo é grande demais. Envie um XML de NF-e de até 2 MB.");
      return;
    }

    setLendo(true);
    try {
      const texto = await lerConteudoXml(file);
      const nota = parseNFe(texto);
      onConcluir({ ...nota, arquivo: file.name });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível processar o XML.");
    } finally {
      setLendo(false);
    }
  }

  function handleArquivos(lista) {
    const file = lista?.[0];
    processarArquivo(file);
  }

  return (
    <section className="rounded-2xl border border-line bg-panel p-5 shadow-[0_12px_40px_-20px_rgba(15,42,61,0.35)] sm:p-7">
      <h2 className="font-display text-xl font-semibold text-ink">Nota fiscal</h2>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">
        Envie o XML da NF-e ou NFC-e. A leitura acontece neste navegador: código, descrição,
        quantidade e valor de cada item.
      </p>

      <label
        onDragEnter={(event) => {
          event.preventDefault();
          setArrastando(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setArrastando(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setArrastando(false);
          handleArquivos(event.dataTransfer.files);
        }}
        className={`mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition ${
          arrastando ? "border-accent bg-[#e8f4f2]" : "border-line bg-surface hover:border-accent hover:bg-[#e8f4f2]"
        }`}
      >
        <span className="font-display text-base font-semibold text-ink">
          {lendo ? "Lendo XML…" : "Arraste o XML ou clique para enviar"}
        </span>
        <span className="text-xs text-ink-soft">Arquivo .xml de NF-e ou NFC-e</span>
        <input
          type="file"
          accept=".xml,text/xml,application/xml"
          className="sr-only"
          disabled={lendo}
          aria-label="Selecionar XML da nota fiscal"
          onChange={(event) => {
            handleArquivos(event.target.files);
            event.target.value = "";
          }}
        />
      </label>

      {erro && (
        <p role="alert" className="mt-4 rounded-lg border border-red-400 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
          {erro}
        </p>
      )}
    </section>
  );
}
