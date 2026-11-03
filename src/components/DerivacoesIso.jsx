import { useState } from "react";

// Desenhos isométricos simples das derivações (eletrocalha / leito)
const L = { stroke: "currentColor", strokeWidth: 3, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
const iso = {
  c90h: <g {...L}><path d="M10 60 L40 75 L40 45 Q40 30 55 22 L85 8" /><path d="M10 48 L32 59 L32 45 Q32 25 50 14 L72 3" opacity=".5" /></g>,
  c45h: <g {...L}><path d="M8 62 L45 62 L85 25" /><path d="M8 50 L40 50 L72 18" opacity=".5" /></g>,
  c90s: <g {...L}><path d="M10 70 L45 70 Q60 70 60 55 L60 8" /><path d="M20 62 L45 62 Q52 62 52 55 L52 8" opacity=".5" /><path d="M70 20 L60 8 L50 20" /></g>,
  c90d: <g {...L}><path d="M10 15 L45 15 Q60 15 60 30 L60 75" /><path d="M20 23 L45 23 Q52 23 52 30 L52 75" opacity=".5" /><path d="M50 63 L60 75 L70 63" /></g>,
  c45s: <g {...L}><path d="M8 70 L40 70 L80 15" /><path d="M8 60 L36 60 L70 12" opacity=".5" /><path d="M66 14 L80 15 L78 28" /></g>,
  c45d: <g {...L}><path d="M8 15 L40 15 L80 70" /><path d="M8 25 L36 25 L70 72" opacity=".5" /><path d="M66 70 L80 70 L78 57" /></g>,
  te: <g {...L}><path d="M5 50 L90 50" /><path d="M5 38 L90 38" opacity=".5" /><path d="M40 38 L40 5 M55 38 L55 5" /></g>,
  cruz: <g {...L}><path d="M5 45 L90 45" /><path d="M5 33 L90 33" opacity=".5" /><path d="M40 33 L40 3 M55 33 L55 3 M40 45 L40 78 M55 45 L55 78" /></g>,
  red: <g {...L}><path d="M5 25 L35 25 L60 35 L90 35" /><path d="M5 60 L35 60 L60 50 L90 50" /></g>,
};

export const PECAS = [
  { id: "c90h", nome: "Curva horizontal 90°", talas: 2 },
  { id: "c45h", nome: "Curva horizontal 45°", talas: 2 },
  { id: "c90s", nome: "Curva vertical de subida 90°", talas: 2 },
  { id: "c90d", nome: "Curva vertical de descida 90°", talas: 2 },
  { id: "c45s", nome: "Curva vertical de subida 45°", talas: 2 },
  { id: "c45d", nome: "Curva vertical de descida 45°", talas: 2 },
  { id: "te", nome: "Tê horizontal", talas: 3 },
  { id: "cruz", nome: "Cruzeta horizontal", talas: 4 },
  { id: "red", nome: "Redução concêntrica", talas: 2 },
];

const DIMS = {
  eletrocalha: ["50x50mm", "100x50mm", "150x50mm", "200x50mm", "300x50mm", "100x100mm", "150x100mm", "200x100mm", "300x100mm", "400x100mm", "500x100mm", "600x100mm"],
  leito: ["100x100mm", "150x100mm", "200x100mm", "300x100mm", "400x100mm", "500x100mm", "600x100mm", "800x100mm", "1000x100mm"],
};

// Cada tala de junção leva 4 conjuntos de parafuso lentilha + porca + arruela
export function itensDerivacao({ linha, dimensao, peca, qtd }) {
  const p = PECAS.find((x) => x.id === peca);
  const aba = dimensao.split("x")[1];
  const rosca = linha === "leito" ? '3/8"' : '1/4"';
  const nomeLinha = linha === "leito" ? "leito para cabos" : "eletrocalha perfurada";
  const talas = p.talas * qtd;
  const conj = talas * 4;
  const cat = "Eletrodutos e conexões";
  const grupo = `Derivações ${nomeLinha} ${dimensao}`;
  return [
    { nome: `${p.nome} para ${nomeLinha} ${dimensao}`, quantidade: qtd, unidade: "un", categoria: cat, grupo },
    { nome: `Tala de junção para ${nomeLinha} aba ${aba}`, quantidade: talas, unidade: "un", categoria: cat, grupo },
    { nome: `Parafuso cabeça de lentilha auto travante ${rosca}`, quantidade: conj, unidade: "un", categoria: cat, grupo },
    { nome: `Porca sextavada ${rosca}`, quantidade: conj, unidade: "un", categoria: cat, grupo },
    { nome: `Arruela lisa ${rosca}`, quantidade: conj, unidade: "un", categoria: cat, grupo },
  ];
}

export default function DerivacoesIso({ onAdicionar }) {
  const [linha, setLinha] = useState("eletrocalha");
  const [dimensao, setDimensao] = useState("100x50mm");
  const [peca, setPeca] = useState("c90h");
  const [qtd, setQtd] = useState("1");
  const [aviso, setAviso] = useState("");

  const adicionar = () => {
    const n = Math.max(1, Number(qtd) || 1);
    onAdicionar(itensDerivacao({ linha, dimensao, peca, qtd: n }));
    setAviso(`${n}× ${PECAS.find((p) => p.id === peca).nome} adicionada com talas e parafusos.`);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <select aria-label="Linha" value={linha} onChange={(e) => { setLinha(e.target.value); setDimensao(DIMS[e.target.value][0]); }}>
          <option value="eletrocalha">Eletrocalha perfurada</option>
          <option value="leito">Leito para cabos</option>
        </select>
        <select aria-label="Dimensão" value={dimensao} onChange={(e) => setDimensao(e.target.value)}>
          {DIMS[linha].map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8, marginBottom: 10 }}>
        {PECAS.map((p) => (
          <button key={p.id} type="button" aria-pressed={peca === p.id} onClick={() => setPeca(p.id)}
            style={{ background: "transparent", color: "inherit", border: peca === p.id ? "2px solid var(--blue)" : "1px solid var(--rule)", borderRadius: 4, padding: 6, fontSize: 11, lineHeight: 1.2 }}>
            <svg viewBox="0 0 95 82" width="100%" height="56" aria-hidden="true">{iso[p.id]}</svg>
            {p.nome}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="number" min="1" aria-label="Quantidade" value={qtd} onChange={(e) => setQtd(e.target.value)} style={{ width: 72 }} />
        <button type="button" onClick={adicionar} style={{ background: "var(--blue)", color: "white", border: "none", borderRadius: 3, padding: "8px 12px", fontSize: 13, height: 34 }}>Adicionar peça</button>
      </div>
      <p role="status" aria-live="polite" style={{ fontSize: 12, marginTop: 8 }}>{aviso}</p>
    </div>
  );
}
