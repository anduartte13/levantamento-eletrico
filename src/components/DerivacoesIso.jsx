import { useState } from "react";

// ===== Desenho isométrico leve (SVG gerado por código, 100% offline) =====
const C30 = Math.cos(Math.PI / 6);
const proj = ([x, y, z]) => [(x - y) * C30, (x + y) * 0.5 - z];
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((c) => c / l); };

// Gera fundo + 2 abas de uma calha seguindo um caminho de pontos 3D
function calha(pts, larg, modo = "h", H = 7) {
  const n = pts.length;
  const larguras = Array.isArray(larg) ? larg : pts.map(() => larg);
  const esq = [], dir = [], esqT = [], dirT = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const t = norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
    const w = modo === "h" ? [-t[1], t[0], 0] : [0, 1, 0];
    const h = modo === "h" ? [0, 0, 1] : norm([-t[2], 0, t[0]]);
    const L = add(pts[i], w, larguras[i] / 2), R = add(pts[i], w, -larguras[i] / 2);
    esq.push(L); dir.push(R); esqT.push(add(L, h, H)); dirT.push(add(R, h, H));
  }
  const poly = (arr) => arr.map((p) => proj(p).map((v) => v.toFixed(1)).join(",")).join(" ");
  return [
    { pts: poly([...esq, ...[...dir].reverse()]), f: "fundo" },
    { pts: poly([...dir, ...[...dirT].reverse()]), f: "aba" },
    { pts: poly([...esq, ...[...esqT].reverse()]), f: "aba2" },
  ];
}
const arco = (cx, cy, r, a0, a1, z = 0, passos = 10) =>
  Array.from({ length: passos + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / passos; return [cx + r * Math.cos(a), cy + r * Math.sin(a), z]; });
const arcoV = (cx, cz, r, a0, a1, passos = 10) =>
  Array.from({ length: passos + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / passos; return [cx + r * Math.cos(a), 0, cz + r * Math.sin(a)]; });
const P = Math.PI;
const W = 22;

const FORMAS = {
  c90h: () => calha([[-30, 0, 0], [0, 0, 0], ...arco(0, 30, 30, -P / 2, 0).slice(1), [30, 60, 0]], W),
  c45h: () => calha([[-30, 0, 0], [0, 0, 0], ...arco(0, 40, 40, -P / 2, -P / 4).slice(1), [28.3 + 21, 11.7 + 21, 0]], W),
  cvi: () => calha([[-35, 0, 0], [0, 0, 0], ...arcoV(0, 28, 28, -P / 2, 0).slice(1), [28, 0, 60]], W, "v"),
  cve: () => calha([[-35, 0, 40], [0, 0, 40], ...arcoV(0, 12, 28, P / 2, 0).slice(1), [28, 0, -25]], W, "v"),
  te: () => [...calha([[0, -14, 0], [0, -55, 0]], W), ...calha([[-50, 0, 0], [50, 0, 0]], W)],
  cruz: () => [...calha([[0, -50, 0], [0, 50, 0]], W), ...calha([[-50, 0, 0], [50, 0, 0]], W)],
  desvE: () => calha([[-45, 0, 0], [-15, 0, 0], [0, -6, 0], [15, -20, 0], [30, -26, 0], [60, -26, 0]], W),
  desvD: () => calha([[-45, 0, 0], [-15, 0, 0], [0, 6, 0], [15, 20, 0], [30, 26, 0], [60, 26, 0]], W),
  red: () => calha([[-45, 0, 0], [-10, 0, 0], [10, 0, 0], [45, 0, 0]], [34, 34, 18, 18]),
};

const COR = { fundo: "var(--iso-fundo, #cfd6dd)", aba: "var(--iso-aba, #8e9aa6)", aba2: "var(--iso-aba2, #b3bdc7)" };

function Desenho({ id }) {
  const faces = FORMAS[id]();
  const todos = faces.flatMap((f) => f.pts.split(" ").map((p) => p.split(",").map(Number)));
  const xs = todos.map((p) => p[0]), ys = todos.map((p) => p[1]);
  const m = 4, x0 = Math.min(...xs) - m, y0 = Math.min(...ys) - m;
  const vb = `${x0} ${y0} ${Math.max(...xs) - x0 + m} ${Math.max(...ys) - y0 + m}`;
  return (
    <svg viewBox={vb} width="100%" height="70" aria-hidden="true">
      {faces.map((f, i) => <polygon key={i} points={f.pts} fill={COR[f.f]} stroke="#2b3238" strokeWidth="1.2" strokeLinejoin="round" />)}
    </svg>
  );
}

// ===== Catálogo (nomenclatura padrão Bandeirantes) =====
export const PECAS = [
  { id: "c90h", nome: "Curva horizontal 90° (raio segmentado)", curto: "Curva horiz. 90°", talas: 2 },
  { id: "c45h", nome: "Curva horizontal 45° (raio segmentado)", curto: "Curva horiz. 45°", talas: 2 },
  { id: "cvi", nome: "Curva vertical interna 90° (raio segmentado)", curto: "Curva vert. interna (subida)", talas: 2 },
  { id: "cve", nome: "Curva vertical externa 90° (raio segmentado)", curto: "Curva vert. externa (descida)", talas: 2 },
  { id: "te", nome: "Tê horizontal (raio segmentado)", curto: "Tê horizontal", talas: 3 },
  { id: "cruz", nome: "Cruzeta horizontal (raio segmentado)", curto: "Cruzeta horizontal", talas: 4 },
  { id: "desvE", nome: "Desvio à esquerda", curto: "Desvio à esquerda", talas: 2 },
  { id: "desvD", nome: "Desvio à direita", curto: "Desvio à direita", talas: 2 },
  { id: "red", nome: "Redução concêntrica", curto: "Redução concêntrica", talas: 2, reducao: true },
];

const DIMS = {
  eletrocalha: ["50x50mm", "100x50mm", "150x50mm", "200x50mm", "300x50mm", "100x100mm", "150x100mm", "200x100mm", "300x100mm", "400x100mm", "500x100mm", "600x100mm"],
  leito: ["100x100mm", "150x100mm", "200x100mm", "300x100mm", "400x100mm", "500x100mm", "600x100mm", "800x100mm", "1000x100mm"],
};
const largura = (d) => Number(d.split("x")[0]);
const aba = (d) => d.split("x")[1];
const menores = (linha, d) => DIMS[linha].filter((x) => largura(x) < largura(d) && aba(x) === aba(d));

// Aba 50mm = 2 furos por tala; aba 100mm = 4 furos por tala
export function itensDerivacao({ linha, dimensao, saida, peca, qtd }) {
  const p = PECAS.find((x) => x.id === peca);
  const ab = aba(dimensao);
  const rosca = linha === "leito" ? '3/8"' : '1/4"';
  const nomeLinha = linha === "leito" ? "leito para cabos" : "eletrocalha perfurada";
  const talas = p.talas * qtd;
  const conj = talas * (ab === "50mm" ? 2 : 4);
  const cat = "Eletrodutos e conexões";
  const grupo = `Derivações ${nomeLinha} ${dimensao}`;
  const nomePeca = p.reducao && saida
    ? `${p.nome} para ${nomeLinha} ${dimensao} para ${saida}`
    : `${p.nome} para ${nomeLinha} ${dimensao}`;
  return [
    { nome: nomePeca, quantidade: qtd, unidade: "un", categoria: cat, grupo },
    { nome: `Tala de junção para ${nomeLinha} aba ${ab}`, quantidade: talas, unidade: "un", categoria: cat, grupo },
    { nome: `Parafuso cabeça de lentilha auto travante ${rosca}`, quantidade: conj, unidade: "un", categoria: cat, grupo },
    { nome: `Porca sextavada ${rosca}`, quantidade: conj, unidade: "un", categoria: cat, grupo },
    { nome: `Arruela lisa ${rosca}`, quantidade: conj, unidade: "un", categoria: cat, grupo },
  ];
}

export default function DerivacoesIso({ onAdicionar }) {
  const [linha, setLinha] = useState("eletrocalha");
  const [dimensao, setDimensao] = useState("100x50mm");
  const [saida, setSaida] = useState("");
  const [peca, setPeca] = useState("c90h");
  const [qtd, setQtd] = useState("1");
  const [aviso, setAviso] = useState("");

  const atual = PECAS.find((p) => p.id === peca);
  const opcoesSaida = menores(linha, dimensao);
  const saidaOk = opcoesSaida.includes(saida) ? saida : opcoesSaida[opcoesSaida.length - 1] || "";

  const adicionar = () => {
    if (atual.reducao && !saidaOk) { setAviso("Escolha uma medida de entrada maior para ter uma saída menor."); return; }
    const n = Math.max(1, Number(qtd) || 1);
    onAdicionar(itensDerivacao({ linha, dimensao, saida: saidaOk, peca, qtd: n }));
    setAviso(`${n}× ${atual.curto} adicionada com talas e parafusos.`);
  };

  const sel = { padding: "8px", fontSize: 14, minHeight: 40 };
  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <select aria-label="Linha" style={sel} value={linha} onChange={(e) => { setLinha(e.target.value); setDimensao(DIMS[e.target.value][1] || DIMS[e.target.value][0]); }}>
          <option value="eletrocalha">Eletrocalha perfurada</option>
          <option value="leito">Leito para cabos</option>
        </select>
        <label style={{ display: "flex", flexDirection: "column", fontSize: 11 }}>
          {atual.reducao ? "Medida maior (entrada)" : "Medida"}
          <select aria-label={atual.reducao ? "Medida maior de entrada" : "Dimensão"} style={sel} value={dimensao} onChange={(e) => setDimensao(e.target.value)}>
            {DIMS[linha].map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        {atual.reducao && (
          <label style={{ display: "flex", flexDirection: "column", fontSize: 11 }}>
            Medida menor (saída)
            <select aria-label="Medida menor de saída" style={sel} value={saidaOk} onChange={(e) => setSaida(e.target.value)}>
              {opcoesSaida.length === 0 && <option value="">—</option>}
              {opcoesSaida.map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 12 }}>
        {PECAS.map((p) => {
          const ativo = peca === p.id;
          return (
            <button key={p.id} type="button" aria-pressed={ativo} onClick={() => setPeca(p.id)}
              style={{ background: ativo ? "rgba(255,176,0,0.12)" : "transparent", color: "inherit", border: ativo ? "2px solid #FFB000" : "1px solid var(--rule)", borderRadius: 8, padding: 8, fontSize: 12, fontWeight: ativo ? 700 : 500, lineHeight: 1.25, minHeight: 112, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Desenho id={p.id} />
              {p.curto}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="number" min="1" aria-label="Quantidade" value={qtd} onChange={(e) => setQtd(e.target.value)} style={{ width: 72, minHeight: 40, fontSize: 15 }} />
        <button type="button" onClick={adicionar} style={{ background: "var(--blue)", color: "white", border: "none", borderRadius: 4, padding: "10px 14px", fontSize: 14, minHeight: 40 }}>Adicionar peça</button>
      </div>
      <p role="status" aria-live="polite" style={{ fontSize: 12, marginTop: 8 }}>{aviso}</p>
    </div>
  );
}
