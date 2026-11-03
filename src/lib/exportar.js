// Ordenação, margem de perda e exportações (PDF / Excel)

const RE_CABO = /^Cabo flexível\s+([\d.,]+)mm²\s+—\s+(.+)$/i;

export function compararItens(a, b) {
  const ca = a.nome.match(RE_CABO);
  const cb = b.nome.match(RE_CABO);
  if (ca && cb) {
    const ba = parseFloat(ca[1].replace(",", "."));
    const bb = parseFloat(cb[1].replace(",", "."));
    if (ba !== bb) return ba - bb;
    const pa = /^preto$/i.test(ca[2].trim()) ? 0 : 1;
    const pb = /^preto$/i.test(cb[2].trim()) ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return ca[2].localeCompare(cb[2], "pt-BR");
  }
  const fa = chaveFixador(a.nome);
  const fb = chaveFixador(b.nome);
  if (fa && fb) {
    if (fa.familia !== fb.familia) return fa.familia.localeCompare(fb.familia, "pt-BR");
    return fa.ordem - fb.ordem;
  }
  return chaveOrdenacao(a.nome).localeCompare(chaveOrdenacao(b.nome), "pt-BR");
}

// Conjuntos de fixação: Barra roscada/Parafuso -> Porca -> Arruela, juntos por bitola
const RE_FIX = /^(Barra roscada|Parafuso|Porca|Arruela)\b(.*?)(\d+\/\d+"|M\d+)/i;
function chaveFixador(nome) {
  if (/^Parafuso com bucha \(abraçadeira/i.test(nome)) return null;
  const m = nome.match(RE_FIX);
  if (!m) return null;
  const tipo = m[1].toLowerCase();
  const rosca = /barra roscada/i.test(nome);
  const ordem = tipo === "barra roscada" ? 0 : tipo === "parafuso" ? 1 : tipo === "porca" ? 2 : 3;
  return { familia: `${rosca ? "Barra roscada" : "Parafuso"} ${m[3]}`, ordem };
}
// Itens fora de conjunto são posicionados junto ao nome da família (Parafuso...)
function chaveOrdenacao(nome) {
  const b = nome.match(/^Parafuso com bucha \(abraçadeira eletroduto (.+)\)$/i);
  if (b) return `Abraçadeira tipo D com cunha ${b[1]} ~`;
  const f = chaveFixador(nome);
  return f ? f.familia : nome;
}

export const OPCOES_PERDA = [0, 3, 5, 10];

// Perda aplica-se a itens medidos em metros (cabos, eletrodutos, calhas, tubos)
export function qtdCompra(item, perda) {
  if (!perda || item.unidade !== "m") return item.quantidade;
  return Math.ceil(item.quantidade * (1 + perda / 100));
}

const fmt = (n) => String(n).replace(".", ",");
const nomeArquivo = (obra, ext) => `${(obra || "levantamento").replace(/[^\w\-]+/g, "-")}.${ext}`;

export async function gerarPDF({ obra, subtitulo, grupos, perda }) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Eletron Watts Construções", 14, 15);
  doc.setFontSize(11);
  doc.text(obra || "Levantamento de materiais", 14, 22);
  doc.setFontSize(9);
  doc.text(`${subtitulo} · ${new Date().toLocaleDateString("pt-BR")}${perda ? ` · Perda ${perda}%` : ""}`, 14, 28);
  let y = 33;
  for (const g of grupos) {
    autoTable(doc, {
      startY: y,
      head: [[{ content: g.titulo, colSpan: 5 }], ["", "Descrição", "Qtd medida", "Qtd compra", "Un"]],
      body: g.itens.map((i) => [i.adquirido ? "OK" : "", i.nome, fmt(i.quantidade), fmt(qtdCompra(i, perda)), i.unidade]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [28, 31, 34] },
      columnStyles: { 0: { cellWidth: 10 }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { cellWidth: 12 } },
    });
    y = doc.lastAutoTable.finalY + 6;
  }
  if (!grupos.length) doc.text("Nenhum item.", 14, y + 4);
  doc.save(nomeArquivo(obra, "pdf"));
}

export async function gerarExcel({ obra, subtitulo, grupos, perda }) {
  const XLSX = await import("xlsx");
  const linhas = [
    ["Eletron Watts Construções"],
    [obra || "Levantamento de materiais"],
    [`${subtitulo} · ${new Date().toLocaleDateString("pt-BR")} · Perda ${perda}%`],
    [],
    ["Item", "Descrição", "Qtd medida", "Qtd compra", "Unidade", "Categoria", "Status"],
  ];
  let n = 1;
  for (const g of grupos)
    for (const i of g.itens)
      linhas.push([n++, i.nome, i.quantidade, qtdCompra(i, perda), i.unidade, g.titulo, i.adquirido ? "Comprado" : "Pendente"]);
  const ws = XLSX.utils.aoa_to_sheet(linhas);
  ws["!cols"] = [{ wch: 6 }, { wch: 55 }, { wch: 11 }, { wch: 11 }, { wch: 8 }, { wch: 28 }, { wch: 10 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Levantamento");
  XLSX.writeFile(wb, nomeArquivo(obra, "xlsx"));
}
