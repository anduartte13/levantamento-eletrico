import { useState } from "react";

const btn = (ativo) => ({ fontSize: 12, padding: "8px 10px", borderRadius: 16, border: "1px solid var(--blue)", background: ativo ? "var(--blue)" : "transparent", color: ativo ? "white" : "var(--blue)", textAlign: "left" });
const btnAdd = { background: "var(--blue)", color: "white", border: "none", borderRadius: 3, padding: "9px 14px", fontSize: 13, fontWeight: 600 };
const grade = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 10 };

function Modulo({ cor, titulo, sub, children }) {
  return (
    <details className="modulo" style={{ marginBottom: 16 }}>
      <summary>
        <div style={{ borderLeft: `4px solid ${cor}`, paddingLeft: 10, marginBottom: 10 }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, margin: 0 }}>{titulo}</h2>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "2px 0 0" }}>{sub}</p>
        </div>
      </summary>
      {children}
    </details>
  );
}

// ---------- Lançador rápido genérico (chips + quantidade) ----------
function Lancador({ cor, titulo, sub, grupos, categoria, extras, onAdicionar }) {
  const [nome, setNome] = useState("");
  const [qtd, setQtd] = useState(0);
  const add = () => {
    if (!nome || !qtd) return;
    const lista = [{ nome, quantidade: qtd, unidade: "un", categoria }];
    for (const e of (extras?.(nome) || [])) lista.push({ ...e, quantidade: e.quantidade * qtd, categoria: e.categoria || categoria });
    onAdicionar(lista); setQtd(0);
  };
  return (
    <Modulo cor={cor} titulo={titulo} sub={sub}>
      {grupos.map(([g, itens]) => (
        <div key={g} style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 6px" }}>{g}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {itens.map((n) => <button key={n} type="button" aria-pressed={nome === n} onClick={() => setNome(n)} style={btn(nome === n)}>{n}</button>)}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {[1, 5, 10].map((q) => <button key={q} type="button" onClick={() => setQtd((v) => v + q)} style={{ fontSize: 13, padding: "8px 12px", borderRadius: 3, border: "1px solid var(--ink-soft)", background: "transparent" }}>+{q}</button>)}
        <input type="number" aria-label="Quantidade" min="0" value={qtd || ""} onChange={(e) => setQtd(Number(e.target.value) || 0)} style={{ width: 80 }} />
        <button type="button" onClick={add} disabled={!nome || !qtd} style={btnAdd}>Adicionar {qtd ? `${qtd} un` : ""}</button>
      </div>
    </Modulo>
  );
}

// ---------- Incêndio: complementos ----------
const EXTINTORES = [
  ["Pó químico", ["Extintor Pó ABC 4kg", "Extintor Pó ABC 6kg", "Extintor Pó BC 4kg", "Extintor Pó BC 6kg"]],
  ["Água / CO₂ / Cozinha", ["Extintor Água Pressurizada 10L", "Extintor CO₂ 4kg", "Extintor CO₂ 6kg", "Extintor Classe K 6L"]],
];
const PLACAS = [
  ["Equipamentos (NBR 13434)", ["Placa fotoluminescente Extintor E5", "Placa fotoluminescente Hidrante E8", "Placa fotoluminescente Alarme E1", "Placa de piso demarcação extintor (1x1m)"]],
  ["Rotas de fuga", ["Placa fotoluminescente Saída S12", "Placa fotoluminescente Seta direita S2", "Placa fotoluminescente Seta esquerda S1", "Placa fotoluminescente Escada S9", "Placa de identificação de pavimento"]],
  ["Proibição / alerta", ["Placa Proibido fumar P1", "Placa Risco de choque elétrico A5"]],
];
const SDAI = [
  ["Central", ["Central de alarme convencional 12 laços", "Central de alarme endereçável 1 laço", "Bateria selada 12V 7Ah"]],
  ["Detectores", ["Detector de fumaça óptico", "Detector termovelocimétrico", "Base para detector"]],
  ["Acionamento e sinalização", ["Acionador manual tipo quebra-vidro", "Sirene audiovisual 12/24V"]],
  ["Iluminação de emergência", ["Bloco autônomo LED 2 faróis 1200lm", "Luminária de emergência LED 30 leds", "Luminária de emergência LED 2W balizamento"]],
];
const extrasExtintor = (n) => [
  { nome: n.includes("Classe K") || n.includes("Água") ? "Suporte de parede para extintor" : "Suporte de parede para extintor", quantidade: 1, unidade: "un" },
  { nome: "Bucha S8 com parafuso comum", quantidade: 2, unidade: "un" },
];
const extrasPlaca = () => [{ nome: "Fita dupla face 19mm x 20m", quantidade: 0.1, unidade: "rl" }];
const extrasSdai = (n) => {
  if (n.startsWith("Detector")) return [{ nome: "Base para detector", quantidade: 1, unidade: "un" }, { nome: "Bucha S6 com parafuso comum", quantidade: 2, unidade: "un" }];
  if (n.startsWith("Acionador") || n.startsWith("Sirene") || n.startsWith("Bloco") || n.startsWith("Luminária")) return [{ nome: "Bucha S6 com parafuso comum", quantidade: 2, unidade: "un" }];
  return [];
};

function CaboAlarme({ onAdicionar }) {
  const [m, setM] = useState("");
  const add = () => {
    const v = Number(m) || 0; if (!v) return;
    onAdicionar([
      { nome: "Cabo blindado para alarme 2x1,50mm²", quantidade: Math.ceil(v), unidade: "m", categoria: "Detecção e alarme" },
      { nome: 'Eletroduto galvanizado 3/4" (barra 3,00m)', quantidade: Math.ceil(v / 3), unidade: "pç", categoria: "Detecção e alarme" },
      { nome: 'Abraçadeira tipo D com cunha 3/4"', quantidade: Math.ceil(v / 1.5), unidade: "un", categoria: "Detecção e alarme" },
      { nome: "Bucha S6 com parafuso comum", quantidade: Math.ceil(v / 1.5), unidade: "un", categoria: "Detecção e alarme" },
    ]); setM("");
  };
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap", marginTop: -6, marginBottom: 16 }}>
      <label className="campo">Laço de alarme (m)<input type="number" min="0" value={m} onChange={(e) => setM(e.target.value)} /></label>
      <button type="button" onClick={add} disabled={!Number(m)} style={btnAdd}>+ Cabo, eletroduto e fixação</button>
    </div>
  );
}

export function ComplementosIncendio({ onAdicionar }) {
  return (<>
    <Lancador cor="var(--red)" titulo="Extintores" sub="Tipo e capacidade; suporte e fixação entram automaticamente." grupos={EXTINTORES} categoria="Extintores" extras={extrasExtintor} onAdicionar={onAdicionar} />
    <Lancador cor="var(--red)" titulo="Sinalização fotoluminescente" sub="Placas NBR 13434 para equipamentos e rotas de fuga." grupos={PLACAS} categoria="Sinalização de emergência" extras={extrasPlaca} onAdicionar={onAdicionar} />
    <Lancador cor="var(--red)" titulo="Detecção, alarme e iluminação de emergência" sub="Central, detectores, acionadores, sirenes e blocos autônomos." grupos={SDAI} categoria="Detecção e alarme" extras={extrasSdai} onAdicionar={(l) => onAdicionar(l.map((i) => /Bloco|Luminária/.test(i.nome) ? { ...i, categoria: "Iluminação de emergência" } : i))} />
    <CaboAlarme onAdicionar={onAdicionar} />
  </>);
}

// ---------- Hidráulica Tigre ----------
export const SISTEMAS_HID = {
  fria: { l: "Água fria — PVC soldável Tigre", cat: "Água fria (PVC Tigre)", bitolas: ["20mm", "25mm", "32mm", "40mm", "50mm", "60mm", "75mm", "85mm", "110mm"], barra: 6, tubo: "Tubo PVC soldável Tigre", insumo: true },
  cpvc: { l: "Água quente — Aquatherm CPVC Tigre", cat: "Água quente (Aquatherm / PPR)", bitolas: ["15mm", "22mm", "28mm", "35mm", "42mm", "54mm"], barra: 3, tubo: "Tubo Aquatherm CPVC Tigre", insumo: "cpvc" },
  ppr: { l: "Água quente — PPR Tigre (termofusão)", cat: "Água quente (Aquatherm / PPR)", bitolas: ["20mm", "25mm", "32mm", "40mm", "50mm", "63mm"], barra: 3, tubo: "Tubo PPR PN25 Tigre" },
  esgN: { l: "Esgoto — Série Normal Tigre", cat: "Esgoto e ventilação (Tigre)", bitolas: ["40mm", "50mm", "75mm", "100mm", "150mm"], barra: 6, tubo: "Tubo esgoto Série Normal Tigre", esgoto: true },
  esgR: { l: "Esgoto — Série Reforçada Tigre", cat: "Esgoto e ventilação (Tigre)", bitolas: ["40mm", "50mm", "75mm", "100mm", "150mm"], barra: 6, tubo: "Tubo esgoto Série Reforçada Tigre", esgoto: true },
};

export function calcularHidraulica({ sistema, bitola, metros, j90 = 0, j45 = 0, tes = 0, registros = 0 }) {
  const s = SISTEMAS_HID[sistema]; const m = Number(metros) || 0;
  if (!s || m <= 0) return [];
  const cat = s.cat; const n = (v) => Number(v) || 0;
  const barras = Math.ceil(m / s.barra);
  const conex = s.esgoto
    ? [[`Joelho 90° esgoto ${bitola}`, j90], [`Joelho 45° esgoto ${bitola}`, j45], [`Junção simples 45° esgoto ${bitola}`, tes], [`Luva simples esgoto ${bitola}`, Math.max(barras - 1, 0)]]
    : [[`Joelho 90° ${bitola} (${s.tubo.replace("Tubo ", "")})`, j90], [`Joelho 45° ${bitola} (${s.tubo.replace("Tubo ", "")})`, j45], [`Tê 90° ${bitola} (${s.tubo.replace("Tubo ", "")})`, tes], [`Luva ${bitola} (${s.tubo.replace("Tubo ", "")})`, Math.max(barras - 1, 0)]];
  const out = [{ nome: `${s.tubo} ${bitola} (barra ${s.barra.toFixed(2).replace(".", ",")}m)`, quantidade: barras, unidade: "pç", categoria: cat }];
  for (const [nome, q] of conex) if (n(q) > 0) out.push({ nome, quantidade: n(q), unidade: "un", categoria: cat });
  if (n(registros) > 0) out.push({ nome: `Registro de gaveta bruto ${bitola}`, quantidade: n(registros), unidade: "un", categoria: "Registros, metais e caixas" });
  const juntas = 2 * (n(j90) + n(j45) + Math.max(barras - 1, 0)) + 3 * n(tes);
  if (s.insumo === true && juntas) {
    out.push({ nome: "Adesivo plástico para PVC Tigre 175g", quantidade: Math.ceil(juntas / 40), unidade: "un", categoria: cat });
    out.push({ nome: "Solução preparadora Tigre 200ml", quantidade: Math.ceil(juntas / 60), unidade: "un", categoria: cat });
  }
  if (s.insumo === "cpvc" && juntas) out.push({ nome: "Adesivo Aquatherm Tigre 175g", quantidade: Math.ceil(juntas / 40), unidade: "un", categoria: cat });
  if (s.esgoto && juntas) {
    out.push({ nome: `Anel de borracha esgoto ${bitola}`, quantidade: juntas, unidade: "un", categoria: cat });
    out.push({ nome: "Pasta lubrificante Tigre 400g", quantidade: Math.ceil(juntas / 80), unidade: "un", categoria: cat });
  }
  const fix = Math.ceil(m / (s.esgoto ? 1.5 : 1));
  out.push({ nome: `Abraçadeira tipo D com cunha ${bitola}`, quantidade: fix, unidade: "un", categoria: cat });
  out.push({ nome: "Bucha S8 com parafuso comum", quantidade: fix, unidade: "un", categoria: cat });
  return out;
}

const novoId = () => Math.random().toString(36).slice(2, 10);

export function CalcHidraulica({ onAdicionar, itensSalvos, onRemover }) {
  const [nome, setNome] = useState("");
  const [sistema, setSistema] = useState("fria");
  const [bitola, setBitola] = useState("25mm");
  const [f, setF] = useState({ metros: "", j90: "", j45: "", tes: "", registros: "" });
  const s = SISTEMAS_HID[sistema];
  const itens = calcularHidraulica({ sistema, bitola, ...f });
  const campo = (k, l) => <label className="campo">{l}<input type="number" min="0" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>;
  const add = () => {
    const id = novoId(); const n = nome.trim() || `${s.l.split(" — ")[0]} ${bitola}`;
    onAdicionar(itens.map((i) => ({ ...i, ramalId: id, ramalTipo: "hid", ramal: n, ramalResumo: `${f.metros} m · ${bitola} · ${s.l.split(" — ")[1]}` })));
    setNome(""); setF({ metros: "", j90: "", j45: "", tes: "", registros: "" });
  };
  const grupos = new Map();
  for (const i of itensSalvos || []) if (i.ramalTipo === "hid" && i.ramalId) {
    if (!grupos.has(i.ramalId)) grupos.set(i.ramalId, { nome: i.ramal, resumo: i.ramalResumo, n: 0 });
    grupos.get(i.ramalId).n++;
  }
  return (
    <Modulo cor="var(--blue)" titulo="Tubulação por trecho (Tigre)" sub="Água fria, água quente e esgoto: barras, conexões, insumos e fixação.">
      <div style={grade}>
        <label className="campo">Nome do ramal / trecho<input type="text" placeholder="Ex.: Banheiro social" value={nome} onChange={(e) => setNome(e.target.value)} /></label>
        <label className="campo">Sistema
          <select value={sistema} onChange={(e) => { setSistema(e.target.value); setBitola(SISTEMAS_HID[e.target.value].bitolas[1]); }}>
            {Object.entries(SISTEMAS_HID).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
          </select>
        </label>
        <label className="campo">Bitola<select value={bitola} onChange={(e) => setBitola(e.target.value)}>{s.bitolas.map((b) => <option key={b}>{b}</option>)}</select></label>
        {campo("metros", "Distância (m)")}
        {campo("j90", "Joelhos 90°")}
        {campo("j45", "Joelhos 45°")}
        {campo("tes", s.esgoto ? "Junções 45°" : "Tês 90°")}
        {!s.esgoto && campo("registros", "Registros")}
      </div>
      {itens.length > 0 && <ul style={{ fontSize: 13, margin: "6px 0 10px", paddingLeft: 18 }}>{itens.map((i) => <li key={i.nome}>{i.quantidade} {i.unidade} — {i.nome}</li>)}</ul>}
      <button type="button" disabled={!itens.length} onClick={add} style={btnAdd}>+ Calcular e adicionar</button>
      {grupos.size > 0 && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 6px" }}>Trechos lançados</p>
          {[...grupos].map(([id, g]) => (
            <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--rule)", fontSize: 14 }}>
              <div><strong>{g.nome}</strong><div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{g.resumo} · {g.n} materiais</div></div>
              <button type="button" aria-label={`Excluir ${g.nome}`} onClick={() => onRemover(id)} style={{ background: "transparent", border: "1px solid var(--rule)", borderRadius: 3, padding: "6px 10px", fontSize: 12 }}>Excluir</button>
            </div>
          ))}
        </div>
      )}
    </Modulo>
  );
}

const PECAS_HID = [
  ["Caixas", ["Caixa sifonada 150x150x50mm Tigre", "Caixa sifonada 100x100x50mm Tigre", "Ralo seco 100mm Tigre", "Caixa de gordura 250mm Tigre", "Caixa de inspeção 300mm"]],
  ["Reduções (maior × menor)", ["Redução excêntrica esgoto 100x75mm", "Redução excêntrica esgoto 75x50mm", "Bucha de redução soldável 32x25mm", "Bucha de redução soldável 25x20mm", "Tê de redução soldável 32x25mm"]],
  ["Pontos de consumo", ["Joelho 90° soldável com bucha de latão 25mm x 1/2\"", "Adaptador soldável curto 25mm x 3/4\"", "Registro de pressão 3/4\"", "Engate flexível 40cm"]],
];

export function PecasHidraulica({ onAdicionar }) {
  return <Lancador cor="var(--blue)" titulo="Caixas, reduções e pontos" sub="Peças avulsas do catálogo Tigre com quantidade rápida." grupos={PECAS_HID} categoria="Registros, metais e caixas" onAdicionar={onAdicionar} />;
}

// ---------- Vista isométrica de conexões hidráulicas ----------
const C30H = Math.cos(Math.PI / 6);
const pj = ([x, y, z]) => [(x - y) * C30H, (x + y) * 0.5 - z];
const linha = (pts) => pts.map((p) => pj(p).map((v) => v.toFixed(1)).join(",")).join(" ");
const TUBOS = {
  j90: [[[-40, 0, 0], [0, 0, 0], [0, 40, 0]]],
  j45: [[[-40, 0, 0], [0, 0, 0], [28, 28, 0]]],
  te: [[[-40, 0, 0], [40, 0, 0]], [[0, 0, 0], [0, 40, 0]]],
  jun: [[[-40, 0, 0], [40, 0, 0]], [[0, 0, 0], [26, 30, 0]]],
  luva: [[[-40, 0, 0], [40, 0, 0]]],
  red: [[[-40, 0, 0], [0, 0, 0]], [[0, 0, 0], [40, 0, 0]]],
  cap: [[[-40, 0, 0], [10, 0, 0]]],
  reg: [[[-40, 0, 0], [40, 0, 0]], [[0, 0, 0], [0, 0, 26]]],
};
function DesenhoHid({ id }) {
  if (id === "cx") {
    const t = (z) => linha([[-25, -25, z], [25, -25, z], [25, 25, z], [-25, 25, z], [-25, -25, z]]);
    return (
      <svg viewBox="-55 -45 110 90" width="100%" height="70" aria-hidden="true">
        <polygon points={linha([[25, -25, 0], [25, 25, 0], [25, 25, 28], [25, -25, 28]])} fill="#8e9aa6" stroke="#2b3238" strokeWidth="1.2" />
        <polygon points={linha([[-25, 25, 0], [25, 25, 0], [25, 25, 28], [-25, 25, 28]])} fill="#b3bdc7" stroke="#2b3238" strokeWidth="1.2" />
        <polygon points={t(28)} fill="#cfd6dd" stroke="#2b3238" strokeWidth="1.2" />
        <polyline points={linha([[25, 0, 8], [48, 0, 8]])} stroke="#2b3238" strokeWidth="12" strokeLinecap="round" fill="none" />
        <polyline points={linha([[25, 0, 8], [48, 0, 8]])} stroke="#b3bdc7" strokeWidth="9" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  const segs = TUBOS[id];
  return (
    <svg viewBox="-60 -40 120 80" width="100%" height="70" aria-hidden="true">
      {segs.map((s, i) => {
        const w = id === "red" && i === 1 ? 8 : 13;
        return <g key={i}>
          <polyline points={linha(s)} stroke="#2b3238" strokeWidth={w + 3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <polyline points={linha(s)} stroke="#cfd6dd" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>;
      })}
      {id === "reg" && <circle cx={pj([0, 0, 28])[0]} cy={pj([0, 0, 28])[1]} r="8" fill="#8e9aa6" stroke="#2b3238" strokeWidth="1.5" />}
      {id === "cap" && <circle cx={pj([12, 0, 0])[0]} cy={pj([12, 0, 0])[1]} r="8" fill="#8e9aa6" stroke="#2b3238" strokeWidth="1.5" />}
    </svg>
  );
}

const CONEX_HID = [
  { id: "j90", curto: "Joelho 90°", nome: "Joelho 90°" },
  { id: "j45", curto: "Joelho 45°", nome: "Joelho 45°" },
  { id: "te", curto: "Tê 90°", nome: "Tê 90°" },
  { id: "jun", curto: "Junção 45°", nome: "Junção simples 45°", esgoto: true },
  { id: "luva", curto: "Luva", nome: "Luva" },
  { id: "red", curto: "Redução", nome: "Redução", reducao: true },
  { id: "cap", curto: "Cap / tampão", nome: "Cap" },
  { id: "reg", curto: "Registro", nome: "Registro de gaveta bruto", agua: true },
  { id: "cx", curto: "Caixa sifonada", nome: "Caixa sifonada", caixa: true },
];
const CAIXAS = ["100x100x50mm", "150x150x50mm", "150x185x75mm", "250x172x50mm"];

export function ConexoesHidIso({ onAdicionar }) {
  const [sistema, setSistema] = useState("fria");
  const [bitola, setBitola] = useState("25mm");
  const [saida, setSaida] = useState("");
  const [peca, setPeca] = useState("j90");
  const [qtd, setQtd] = useState("1");
  const s = SISTEMAS_HID[sistema];
  const p = CONEX_HID.find((x) => x.id === peca);
  const menores = s.bitolas.filter((b) => parseInt(b) < parseInt(bitola));
  const saidaOk = menores.includes(saida) ? saida : menores[menores.length - 1] || "";
  const linhaNome = s.tubo.replace("Tubo ", "");
  const pecas = CONEX_HID.filter((x) => !(x.esgoto && !s.esgoto) && !(x.agua && s.esgoto));
  const add = () => {
    const n = Math.max(1, Number(qtd) || 1);
    let nome;
    if (p.caixa) nome = `Caixa sifonada ${bitola} Tigre`;
    else if (p.reducao) { if (!saidaOk) return; nome = `${s.esgoto ? "Redução excêntrica" : "Bucha de redução"} ${bitola} x ${saidaOk} (${linhaNome})`; }
    else nome = `${p.nome} ${bitola} (${linhaNome})`;
    const cat = p.caixa || p.agua ? "Registros, metais e caixas" : s.cat;
    const lista = [{ nome, quantidade: n, unidade: "un", categoria: cat }];
    if (s.esgoto && !p.caixa) lista.push({ nome: `Anel de borracha esgoto ${bitola}`, quantidade: n * (peca === "jun" || peca === "te" ? 3 : peca === "cap" ? 1 : 2), unidade: "un", categoria: s.cat });
    onAdicionar(lista);
  };
  const sel = { padding: 8, fontSize: 14, minHeight: 40 };
  return (
    <Modulo cor="var(--blue)" titulo="Conexões em vista isométrica (Tigre)" sub="Toque no desenho da peça, escolha a bitola e adicione.">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <select aria-label="Sistema" style={sel} value={sistema} onChange={(e) => { setSistema(e.target.value); setBitola(SISTEMAS_HID[e.target.value].bitolas[1]); }}>
          {Object.entries(SISTEMAS_HID).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
        </select>
        <select aria-label={p.caixa ? "Medida da caixa" : p.reducao ? "Bitola maior" : "Bitola"} style={sel} value={p.caixa ? (CAIXAS.includes(bitola) ? bitola : "") : bitola} onChange={(e) => setBitola(e.target.value)}>
          {p.caixa && !CAIXAS.includes(bitola) && <option value="">Medida da caixa</option>}
          {(p.caixa ? CAIXAS : s.bitolas).map((b) => <option key={b}>{b}</option>)}
        </select>
        {p.reducao && (
          <select aria-label="Bitola menor" style={sel} value={saidaOk} onChange={(e) => setSaida(e.target.value)}>
            {!menores.length && <option value="">—</option>}
            {menores.map((b) => <option key={b}>{b}</option>)}
          </select>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10, marginBottom: 12 }}>
        {pecas.map((x) => {
          const ativo = peca === x.id;
          return (
            <button key={x.id} type="button" aria-pressed={ativo} onClick={() => { setPeca(x.id); if (x.caixa) setBitola(CAIXAS[1]); else if (!s.bitolas.includes(bitola)) setBitola(s.bitolas[1]); }}
              style={{ background: ativo ? "rgba(0,120,215,0.10)" : "transparent", color: "inherit", border: ativo ? "2px solid var(--blue)" : "1px solid var(--rule)", borderRadius: 8, padding: 8, fontSize: 12, fontWeight: ativo ? 700 : 500, minHeight: 104, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <DesenhoHid id={x.id} />{x.curto}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="number" min="1" aria-label="Quantidade" value={qtd} onChange={(e) => setQtd(e.target.value)} style={{ width: 72, minHeight: 40 }} />
        <button type="button" onClick={add} disabled={p.reducao && !saidaOk} style={btnAdd}>Adicionar peça</button>
      </div>
    </Modulo>
  );
}
