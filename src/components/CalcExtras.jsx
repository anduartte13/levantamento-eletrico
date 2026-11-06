import { useState } from "react";
import { ComplementosIncendio, CalcHidraulica, PecasHidraulica } from "./CalcIncHid.jsx";

const FIXACAO = [
  ["Chumbadores", ['Parabolt (chumbador) 1/4"', 'Parabolt (chumbador) 3/8"']],
  ["Alvenaria / concreto", ["Bucha S6 com parafuso comum", "Bucha S6 com parafuso fly", "Bucha S8 com parafuso comum", "Bucha S8 com parafuso fly"]],
  ["Drywall", ["Parafuso drywall ponta agulha 3,5x25mm", "Parafuso drywall ponta agulha 3,5x35mm"]],
  ["Metálicos", ["Parafuso autobrocante sextavado 4,8x19mm", "Parafuso capetinha flangeado ponta broca 4,2x13mm", "Parafuso capetinha flangeado ponta broca 4,2x19mm"]],
];

const RISCOS = [
  { v: "leve", l: "Comercial / escritório (risco leve) — 16 m²/bico", m2: 16 },
  { v: "ordinario", l: "Depósito / atacado (risco ordinário) — 12 m²/bico", m2: 12 },
  { v: "dry", l: "Câmara frigorífica (bico dry) — 9 m²/bico", m2: 9 },
  { v: "esfr", l: "Galpão logístico (ESFR) — 9 m²/bico", m2: 9 },
  { v: "manual", l: "Personalizado", m2: 0 },
];
const BICOS = {
  leve: ["Bico sprinkler pendente K-80 68°C", "Bico sprinkler upright K-80 68°C", "Bico sprinkler embutido K-80 68°C"],
  ordinario: ["Bico sprinkler pendente K-80 68°C", "Bico sprinkler upright K-115 68°C"],
  dry: ["Bico sprinkler dry pendente K-80 57°C", "Bico sprinkler dry upright K-80 57°C"],
  esfr: ["Bico ESFR pendente K-200", "Bico ESFR pendente K-240", "Bico ESFR pendente K-360"],
  manual: ["Bico sprinkler pendente K-80 68°C", "Bico sprinkler upright K-80 68°C", "Bico sprinkler dry pendente K-80 57°C", "Bico ESFR pendente K-200"],
};
const BITOLAS_GROOVED = ['1.1/4"', '1.1/2"', '2"', '2.1/2"', '3"', '4"', '6"'];

const btn = (ativo) => ({ fontSize: 12, padding: "8px 10px", borderRadius: 16, border: "1px solid var(--blue)", background: ativo ? "var(--blue)" : "transparent", color: ativo ? "white" : "var(--blue)", textAlign: "left" });
const btnAdd = { background: "var(--blue)", color: "white", border: "none", borderRadius: 3, padding: "9px 14px", fontSize: 13, fontWeight: 600 };
const grade = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 10 };

export function Cabecalho({ cor, titulo, sub }) {
  return (
    <div style={{ borderLeft: `4px solid ${cor}`, paddingLeft: 10, marginBottom: 10 }}>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, margin: 0 }}>{titulo}</h2>
      <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "2px 0 0" }}>{sub}</p>
    </div>
  );
}

function Modulo({ cor, titulo, sub, children }) {
  return (
    <details className="modulo" style={{ marginBottom: 16 }}>
      <summary><Cabecalho cor={cor} titulo={titulo} sub={sub} /></summary>
      {children}
    </details>
  );
}

function Fixacao({ onAdicionar, categoria = "Fixação e parafusos" }) {
  const [nome, setNome] = useState("");
  const [qtd, setQtd] = useState(0);
  const add = () => { if (!nome || !qtd) return; onAdicionar([{ nome, quantidade: qtd, unidade: "un", categoria }]); setQtd(0); };
  return (
    <Modulo cor="var(--ink-soft)" titulo="Fixação e parafusos" sub="Toque na peça, some a quantidade e adicione à lista.">
      {FIXACAO.map(([g, itens]) => (
        <div key={g} style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 6px" }}>{g}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {itens.map((n) => <button key={n} type="button" aria-pressed={nome === n} onClick={() => setNome(n)} style={btn(nome === n)}>{n}</button>)}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {[10, 50, 100, 200].map((q) => <button key={q} type="button" onClick={() => setQtd((v) => v + q)} style={{ fontSize: 13, padding: "8px 12px", borderRadius: 3, border: "1px solid var(--ink-soft)", background: "transparent" }}>+{q}</button>)}
        <input type="number" aria-label="Quantidade" min="0" value={qtd || ""} onChange={(e) => setQtd(Number(e.target.value) || 0)} style={{ width: 80 }} />
        <button type="button" onClick={add} disabled={!nome || !qtd} style={btnAdd}>Adicionar {qtd ? `${qtd} un` : ""}</button>
      </div>
    </Modulo>
  );
}

export function calcularSprinklers({ area, risco, m2Manual, bico, caneta }) {
  const r = RISCOS.find((x) => x.v === risco) || RISCOS[0];
  const cob = r.v === "manual" ? Number(m2Manual) || 0 : r.m2;
  const n = area > 0 && cob > 0 ? Math.ceil(area / cob) : 0;
  if (!n) return [];
  const cat = "Bicos sprinkler e canetas";
  const out = [{ nome: bico, quantidade: n, unidade: "un", categoria: cat }];
  if (caneta === "rigida") out.push(
    { nome: 'Tê ranhurado saída roscada 1"', quantidade: n, unidade: "un", categoria: cat },
    { nome: 'Niple de aço galvanizado 1" x 1,00m (caneta)', quantidade: n, unidade: "un", categoria: cat },
    { nome: 'Luva de redução 1" x 1/2"', quantidade: n, unidade: "un", categoria: cat },
    { nome: "Fita veda-rosca 18mm x 50m", quantidade: Math.ceil(n / 20), unidade: "rl", categoria: cat },
  );
  if (caneta === "flexivel") out.push(
    { nome: 'Mangueira flexível inox para sprinkler 1" x 1,20m', quantidade: n, unidade: "un", categoria: cat },
    { nome: "Suporte de fixação para flexível (forro)", quantidade: n, unidade: "un", categoria: cat },
    { nome: 'Tê ranhurado saída roscada 1"', quantidade: n, unidade: "un", categoria: cat },
  );
  return out;
}

export function calcularGrooved({ metros, bitola }) {
  const m = Number(metros) || 0;
  if (m <= 0) return [];
  const cat = "Tubos e conexões ranhuradas (Glover)";
  const barras = Math.ceil(m / 6);
  return [
    { nome: `Tubo de aço ranhurado SCH-40 ${bitola} (barra 6,00m)`, quantidade: barras, unidade: "pç", categoria: cat },
    { nome: `Acoplamento ranhurado flexível ${bitola} com anel EPDM`, quantidade: Math.max(barras - 1, 0), unidade: "un", categoria: cat },
    { nome: `Suporte tipo pêra ${bitola}`, quantidade: Math.ceil(m / 3), unidade: "un", categoria: cat },
    { nome: 'Barra roscada 3/8" x 1,00m', quantidade: Math.ceil(m / 3), unidade: "un", categoria: cat },
    { nome: 'Parabolt (chumbador) 3/8"', quantidade: Math.ceil(m / 3), unidade: "un", categoria: cat },
    { nome: 'Porca sextavada 3/8"', quantidade: Math.ceil(m / 3) * 2, unidade: "un", categoria: cat },
    { nome: 'Arruela lisa 3/8"', quantidade: Math.ceil(m / 3) * 2, unidade: "un", categoria: cat },
  ];
}

function Lista({ itens }) {
  if (!itens.length) return null;
  return <ul style={{ fontSize: 13, margin: "6px 0 10px", paddingLeft: 18 }}>{itens.map((i) => <li key={i.nome}>{i.quantidade} {i.unidade} — {i.nome}</li>)}</ul>;
}

const novoId = () => Math.random().toString(36).slice(2, 10);

function NomeTrecho({ valor, onChange, exemplo }) {
  return <label className="campo">Nome do ramal / trecho<input type="text" placeholder={exemplo} value={valor} onChange={(e) => onChange(e.target.value)} /></label>;
}

function TrechosSalvos({ tipo, itens, onRemover }) {
  const grupos = new Map();
  for (const i of itens || []) if (i.ramalTipo === tipo && i.ramalId) {
    if (!grupos.has(i.ramalId)) grupos.set(i.ramalId, { nome: i.ramal, resumo: i.ramalResumo, n: 0 });
    grupos.get(i.ramalId).n++;
  }
  if (!grupos.size) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 6px" }}>Trechos lançados</p>
      {[...grupos].map(([id, g]) => (
        <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--rule)", fontSize: 14 }}>
          <div><strong>{g.nome}</strong><div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{g.resumo} · {g.n} materiais</div></div>
          <button type="button" aria-label={`Excluir ${g.nome}`} onClick={() => onRemover(id)} style={{ background: "transparent", border: "1px solid var(--rule)", borderRadius: 3, padding: "6px 10px", fontSize: 12 }}>Excluir</button>
        </div>
      ))}
    </div>
  );
}

const marcar = (lista, tipo, nome, resumo) => { const id = novoId(); return lista.map((i) => ({ ...i, ramalId: id, ramalTipo: tipo, ramal: nome, ramalResumo: resumo })); };

function Sprinklers({ onAdicionar, itensSalvos, onRemover }) {
  const [nome, setNome] = useState("");
  const [modo, setModo] = useState("area");
  const [area, setArea] = useState(""); const [c, setC] = useState(""); const [l, setL] = useState("");
  const [risco, setRisco] = useState("leve"); const [m2Manual, setM2Manual] = useState("");
  const [bico, setBico] = useState(BICOS.leve[0]); const [caneta, setCaneta] = useState("rigida");
  const a = modo === "area" ? Number(area) || 0 : (Number(c) || 0) * (Number(l) || 0);
  const itens = calcularSprinklers({ area: a, risco, m2Manual, bico, caneta });
  return (
    <Modulo cor="var(--red)" titulo="Bicos sprinkler por m²" sub="Área → quantidade de bicos pela cobertura do risco, com caneta/descida completa.">
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <button type="button" aria-pressed={modo === "area"} onClick={() => setModo("area")} style={btn(modo === "area")}>Rápido (área m²)</button>
        <button type="button" aria-pressed={modo === "cxl"} onClick={() => setModo("cxl")} style={btn(modo === "cxl")}>Detalhado (C × L)</button>
      </div>
      <div style={grade}>
        <NomeTrecho valor={nome} onChange={setNome} exemplo="Ex.: Câmara fria A" />
        {modo === "area" ? (
          <label className="campo">Área (m²)<input type="number" min="0" value={area} onChange={(e) => setArea(e.target.value)} /></label>
        ) : (<>
          <label className="campo">Comprimento (m)<input type="number" min="0" value={c} onChange={(e) => setC(e.target.value)} /></label>
          <label className="campo">Largura (m)<input type="number" min="0" value={l} onChange={(e) => setL(e.target.value)} /></label>
        </>)}
        <label className="campo">Ocupação / risco
          <select value={risco} onChange={(e) => { setRisco(e.target.value); setBico(BICOS[e.target.value][0]); }}>{RISCOS.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}</select>
        </label>
        {risco === "manual" && <label className="campo">Cobertura (m²/bico)<input type="number" min="0" value={m2Manual} onChange={(e) => setM2Manual(e.target.value)} /></label>}
        <label className="campo">Tipo de bico
          <select value={bico} onChange={(e) => setBico(e.target.value)}>{BICOS[risco].map((b) => <option key={b}>{b}</option>)}</select>
        </label>
        <label className="campo">Instalação
          <select value={caneta} onChange={(e) => setCaneta(e.target.value)}>
            <option value="direto">Direto no ramal</option>
            <option value="rigida">Com caneta rígida</option>
            <option value="flexivel">Com caneta flexível inox</option>
          </select>
        </label>
      </div>
      {a > 0 && <p style={{ fontSize: 13, margin: 0 }}>Área: <strong>{a.toFixed(2)} m²</strong></p>}
      <Lista itens={itens} />
      <button type="button" disabled={!itens.length} onClick={() => { const n = nome.trim() || `Ramal ${Date.now() % 1000}`; onAdicionar(marcar(itens, "spk", n, `${a.toFixed(1)} m² · ${itens[0].quantidade} bicos`)); setNome(""); setArea(""); setC(""); setL(""); }} style={btnAdd}>+ Calcular e adicionar</button>
      <TrechosSalvos tipo="spk" itens={itensSalvos} onRemover={onRemover} />
    </Modulo>
  );
}

function Grooved({ onAdicionar, itensSalvos, onRemover }) {
  const [nome, setNome] = useState("");
  const [metros, setMetros] = useState(""); const [bitola, setBitola] = useState('2.1/2"');
  const itens = calcularGrooved({ metros, bitola });
  return (
    <Modulo cor="var(--red)" titulo="Rede ranhurada (Glover)" sub="Metros lineares → barras de 6m, acoplamentos com anel EPDM e suportes a cada 3m.">
      <div style={grade}>
        <NomeTrecho valor={nome} onChange={setNome} exemplo='Ex.: Prumada principal 4"' />
        <label className="campo">Distância (m)<input type="number" min="0" value={metros} onChange={(e) => setMetros(e.target.value)} /></label>
        <label className="campo">Bitola<select value={bitola} onChange={(e) => setBitola(e.target.value)}>{BITOLAS_GROOVED.map((b) => <option key={b}>{b}</option>)}</select></label>
      </div>
      <Lista itens={itens} />
      <button type="button" disabled={!itens.length} onClick={() => { const n = nome.trim() || `Trecho ${bitola}`; onAdicionar(marcar(itens, "grv", n, `${metros} m · ${bitola}`)); setMetros(""); setNome(""); }} style={btnAdd}>+ Calcular e adicionar</button>
      <TrechosSalvos tipo="grv" itens={itensSalvos} onRemover={onRemover} />
    </Modulo>
  );
}

export default function CalcExtras({ disciplina, onAdicionar, itensSalvos, onRemover }) {
  const [aviso, setAviso] = useState("");
  const add = (lista) => { onAdicionar(lista); setAviso(`${lista.length} materiais adicionados. Veja na aba Itens.`); setTimeout(() => setAviso(""), 4000); };
  const msg = <p role="status" aria-live="polite" style={{ fontSize: 13, color: "var(--blue)", fontWeight: 600, minHeight: 18 }}>{aviso}</p>;
  if (disciplina === "eletrica") return <>{msg}<Fixacao onAdicionar={add} /></>;
  if (disciplina === "incendio") return (<>{msg}<Sprinklers onAdicionar={add} itensSalvos={itensSalvos} onRemover={onRemover} /><Grooved onAdicionar={add} itensSalvos={itensSalvos} onRemover={onRemover} /><Fixacao onAdicionar={add} categoria="Tubos e conexões ranhuradas (Glover)" /><ComplementosIncendio onAdicionar={add} /></>);
  if (disciplina === "hidraulica") return (<>{msg}<CalcHidraulica onAdicionar={add} itensSalvos={itensSalvos} onRemover={onRemover} /><PecasHidraulica onAdicionar={add} /></>);
  return <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>A calculadora desta disciplina chega em breve. Por enquanto, lance os materiais na aba Itens.</p>;
}
