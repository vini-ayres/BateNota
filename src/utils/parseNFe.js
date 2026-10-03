import { analisarNumeroXml } from "./numeros.js";

function listaTags(raiz, nome) {
  if (!raiz) return [];
  if (typeof raiz.getElementsByTagNameNS === "function") {
    const porNamespace = raiz.getElementsByTagNameNS("*", nome);
    if (porNamespace.length) return Array.from(porNamespace);
  }
  if (typeof raiz.getElementsByTagName === "function") {
    return Array.from(raiz.getElementsByTagName(nome));
  }
  return [];
}

function textoTag(raiz, nome) {
  const elemento = listaTags(raiz, nome)[0];
  return elemento ? (elemento.textContent || "").trim() : "";
}

function documentoInvalido(doc) {
  if (!doc || !doc.documentElement) return true;
  const nome = doc.documentElement.nodeName || "";
  if (nome.toLowerCase() === "parsererror") return true;
  if (typeof doc.getElementsByTagName === "function" && doc.getElementsByTagName("parsererror").length) {
    return true;
  }
  return false;
}

function lerItem(det, ordem) {
  const prod = listaTags(det, "prod")[0];
  if (!prod) return null;

  const codigo = textoTag(prod, "cProd");
  const descricao = textoTag(prod, "xProd");
  if (!codigo && !descricao) return null;

  return {
    nItem: det.getAttribute("nItem") || String(ordem),
    codigo,
    descricao,
    quantidade: analisarNumeroXml(textoTag(prod, "qCom")) ?? 0,
    valorUnitario: analisarNumeroXml(textoTag(prod, "vUnCom")) ?? 0,
    valorTotal: analisarNumeroXml(textoTag(prod, "vProd")),
  };
}

/**
 * Lê um XML de NF-e ou NFC-e e devolve os itens de <infNFe>/<det>.
 * Lança Error com mensagem pronta para o usuário quando o arquivo é inválido.
 */
export function parseNFe(xmlString) {
  const xml = String(xmlString ?? "")
    .replace(/^\uFEFF/, "")
    .trim();

  if (!xml) {
    throw new Error("O arquivo XML está vazio.");
  }

  if (!xml.includes("<")) {
    throw new Error("O arquivo não é um XML válido. Envie a NF-e ou NFC-e em formato .xml.");
  }

  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (documentoInvalido(doc)) {
    throw new Error("Não foi possível ler o XML. O arquivo parece inválido ou corrompido.");
  }

  const infNFe =
    listaTags(doc, "infNFe").find((el) => listaTags(el, "det").length) || listaTags(doc, "infNFe")[0];

  if (!infNFe) {
    throw new Error("Este XML não tem a tag infNFe. Envie uma NF-e ou NFC-e válida.");
  }

  const dets = listaTags(infNFe, "det");
  if (!dets.length) {
    throw new Error("Nenhum item encontrado na nota. A tag det está ausente.");
  }

  const itens = dets.map((det, index) => lerItem(det, index + 1)).filter(Boolean);

  if (!itens.length) {
    throw new Error("Nenhum produto válido encontrado nos itens da nota.");
  }

  const emit = listaTags(infNFe, "emit")[0];
  const ide = listaTags(infNFe, "ide")[0];
  const totais = listaTags(infNFe, "ICMSTot")[0];
  const id = infNFe.getAttribute("Id") || "";

  return {
    itens,
    numero: textoTag(ide, "nNF"),
    serie: textoTag(ide, "serie"),
    emitente: textoTag(emit, "xNome"),
    valorNota: totais ? analisarNumeroXml(textoTag(totais, "vNF")) : null,
    chave: id.replace(/^NFe/i, ""),
  };
}
