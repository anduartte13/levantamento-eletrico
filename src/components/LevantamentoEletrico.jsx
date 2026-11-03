import { useState, useEffect, useMemo, useRef } from "react";
import logoAsset from "@/assets/logo-watts.jpg.asset.json";
import { storage, listarSetores, obraAtual, lerDoSetor } from "@/lib/local-storage-api";
import { compararItens, qtdCompra, OPCOES_PERDA, gerarPDF, gerarExcel } from "@/lib/exportar";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Printer,
  Download,
  Zap,
  List,
  LayoutGrid,
  Calculator,
  Settings2,
  ChevronDown,
  ChevronUp,
  Eraser,
  Send,
} from "lucide-react";

const CATEGORIAS_PADRAO = [
  "Fios e cabos",
  "Disjuntores e proteção",
  "Tomadas e interruptores",
  "Luminárias e lâmpadas",
  "Eletrodutos e conexões",
  "Quadros e caixas",
  "Fixação e parafusos",
  "Outros",
];

const SUGESTOES_FIXACAO = [
  'Parabolt (chumbador) 1/4"', 'Parabolt (chumbador) 3/8"',
  "Bucha S6 com parafuso comum", "Bucha S6 com parafuso fly", "Bucha S8 com parafuso comum", "Bucha S8 com parafuso fly",
  "Parafuso drywall ponta agulha 3,5x25mm", "Parafuso drywall ponta agulha 3,5x35mm",
  "Parafuso autobrocante sextavado 4,8x19mm",
  "Parafuso capetinha flangeado ponta broca 4,2x13mm", "Parafuso capetinha flangeado ponta broca 4,2x19mm",
];

const UNIDADES = ["un", "m", "rl", "cx", "pç", "kg"];

const TIPOS_CIRCUITO = [
  { value: "mono", label: "Monofásico — fase + neutro + terra", fases: 1, neutro: true },
  { value: "bi", label: "Bifásico — 2 fases + neutro + terra", fases: 2, neutro: true },
  { value: "tri", label: "Trifásico — 3 fases + neutro + terra", fases: 3, neutro: true },
];

const FINALIDADES_CIRCUITO = [
  { value: "forca", label: "Tomadas e força", cores: { fase: "Preto", neutro: "Azul", terra: "Verde" } },
  { value: "iluminacao", label: "Iluminação", cores: { fase: "Vermelho", neutro: "Azul", terra: "Verde" } },
];

const TIPOS_INFRA = [
  { value: "eletroduto", label: "Eletroduto", labelDimensao: "Diâmetro", opcoesDimensao: ['1/2"', '3/4"', '1"', '1.1/4"', '1.1/2"', '2"', '2.1/2"', '3"', '4"'] },
  { value: "eletrocalha", label: "Eletrocalha perfurada", labelDimensao: "Dimensão", opcoesDimensao: ["50x50mm", "100x50mm", "150x50mm", "200x50mm", "300x50mm", "100x100mm", "150x100mm", "200x100mm", "300x100mm", "400x100mm", "500x100mm", "600x100mm"] },
  { value: "leito", label: "Leito para cabos", labelDimensao: "Dimensão", opcoesDimensao: ["100x100mm", "150x100mm", "200x100mm", "300x100mm", "400x100mm", "500x100mm", "600x100mm", "800x100mm", "1000x100mm"] },
  { value: "perfilado", label: "Perfilado", labelDimensao: "Dimensão", opcoesDimensao: ["19x38mm", "38x38mm", "38x76mm"] },
];

const BITOLAS_CABO = ["0,5", "0,75", "1", "1,5", "2,5", "4", "6", "10", "16", "25", "35", "50", "70", "95", "120", "150", "185", "240"];
const TIPOS_MULTIPOLAR = [
  { value: "pp", label: "Cabo PP (multipolar)", vias: ["2", "3", "4", "5"], bitolas: ["0,75", "1", "1,5", "2,5", "4", "6", "10"], padraoVias: "3", padraoBitola: "1,5" },
  { value: "shield", label: "Cabo Shield (alarme de incêndio)", vias: ["2", "4"], bitolas: ["0,75", "1", "1,5", "2,5"], padraoVias: "2", padraoBitola: "1,5" },
];
const BITOLAS_TERMINAL = ["10mm", "16mm", "25mm", "35mm", "50mm", "70mm", "95mm", "120mm", "150mm", "185mm", "240mm"];
const OUTRO = "__outro__";

const OPCOES_BARRA_ROSCADA = [
  { value: "nao", label: "Não usar barra roscada" },
  { value: '3/8', label: 'Barra roscada (estirante) 3/8"' },
  { value: '1/4', label: 'Barra roscada (estirante) 1/4"' },
];

const TIPOS_TOMADA = [
  { value: "condulete", label: "Condulete" },
  { value: "industrial", label: "Industrial sobrepor" },
  { value: "aquatic", label: "Aquatic (estanque)" },
  { value: "pial", label: "Pial de embutir" },
];

const AMPERAGENS_TOMADA = ["10A", "20A"];
const CORES_CONDULETE = ["Vermelha", "Preta"];
const FASES_INDUSTRIAL = [
  { value: "mono", label: "Monofásico" },
  { value: "tri", label: "Trifásico" },
];
const PADROES_TRIFASICO_INDUSTRIAL = [
  { value: "3pnt63", label: "3P+N+T 63A 9H Vermelha" },
  { value: "3pt32", label: "3P+T 32A 9H Vermelha" },
  { value: "3pnt32", label: "3P+N+T 32A 9H Vermelha" },
];

const REGRAS_PADRAO = {
  // cabos
  folgaCaboM: 0.5,
  perdaCabosPercent: 0,
  // eletroduto (de zinco)
  barraEletrodutoM: 3,
  espacamentoSuporteM: 1,
  parafusosPorSuporte: 2,
  porcasPorSuporte: 2,
  arruelasPorSuporte: 2,
  perdaEletrodutoPercent: 5,
  tubosPorCondulete: 3,
  unidutsConicosPorCondulete: 2,
  tampasCegaPorCondulete: 1,
  moedasTampaoPorCondulete: 2,
  // tomadas condulete
  moedasTampaoPorCaixaTomada: 1,
  // eletrocalha perfurada
  barraCalhaM: 3,
  espacamentoSuporteCalhaM: 1.5,
  conjuntosPorEmendaCalha: 4,
  perdaCalhaPercent: 5,
  // leito para cabos
  barraLeitoM: 3,
  espacamentoSuporteLeitoM: 1.5,
  emendasPorJuncaoLeito: 4,
  parafusosPorEmendaLeito: 4,
  perdaLeitoPercent: 5,
  // perfilado
  barraPerfiladoM: 6,
  espacamentoSuportePerfiladoM: 1.5,
  conjuntosPorEmendaPerfilado: 2,
  perdaPerfiladoPercent: 5,
  // sustentação por barra roscada (estirante) — comum a eletrocalha, leito e perfilado
  porcasPorBarraRoscada: 4,
  arruelasPorBarraRoscada: 4,
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function calcularCircuito(trecho, regras) {
  const tipoObj = TIPOS_CIRCUITO.find((t) => t.value === trecho.tipo);
  const finalidadeObj = FINALIDADES_CIRCUITO.find((f) => f.value === trecho.finalidade) || FINALIDADES_CIRCUITO[0];
  const cores = finalidadeObj.cores;
  const distancia = Number(trecho.distancia) || 0;
  const cabosPorFase = Number(trecho.cabosPorFase) || 1; // ex: 2x3F+2N+T -> 2 cabos em paralelo por fase e por neutro
  const metragemPorCondutor = distancia * (1 + regras.perdaCabosPercent / 100) + regras.folgaCaboM;
  const grupo = `Cabos ${trecho.bitola}mm²`;
  const itens = [];
  itens.push({
    nome: `Cabo flexível ${trecho.bitola}mm² — ${cores.fase}`,
    quantidade: round2(metragemPorCondutor * tipoObj.fases * cabosPorFase),
    unidade: "m",
    categoria: "Fios e cabos",
    grupo,
  });
  if (tipoObj.neutro) {
    itens.push({
      nome: `Cabo flexível ${trecho.bitola}mm² — ${cores.neutro}`,
      quantidade: round2(metragemPorCondutor * cabosPorFase),
      unidade: "m",
      categoria: "Fios e cabos",
      grupo,
    });
  }
  itens.push({
    nome: `Cabo flexível ${trecho.bitola}mm² — ${cores.terra}`,
    quantidade: round2(metragemPorCondutor),
    unidade: "m",
    categoria: "Fios e cabos",
    grupo,
  });
  return itens;
}

function calcularTerminal(trecho, regras) {
  const tipoObj = TIPOS_CIRCUITO.find((t) => t.value === trecho.tipo);
  const cabosPorFase = Number(trecho.cabosPorFase) || 1;
  const fasesEfetivas = tipoObj.fases * cabosPorFase;
  const neutroEfetivo = tipoObj.neutro ? cabosPorFase : 0;
  const terra = 1; // terra não é multiplicado por cabosPorFase, igual ao cálculo de cabos
  const condutores = fasesEfetivas + neutroEfetivo + terra;
  const terminais = condutores * 2; // 2 pontas por cabo (origem e destino)
  const grupo = `Terminais ${trecho.bitola}`;
  return [
    { nome: `Terminal olhal de compressão ${trecho.bitola}`, quantidade: terminais, unidade: "un", categoria: "Fios e cabos", grupo },
  ];
}

function itensBarraRoscada(trecho, regras, suportes, grupo) {
  if (!trecho.barraRoscada || trecho.barraRoscada === "nao") return [];
  const bitolaRosca = trecho.barraRoscada;
  const porcas = suportes * regras.porcasPorBarraRoscada;
  const arruelas = suportes * regras.arruelasPorBarraRoscada;
  return [
    { nome: `Barra roscada (estirante) ${bitolaRosca}"`, quantidade: suportes, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    { nome: `Porca para barra roscada ${bitolaRosca}"`, quantidade: porcas, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    { nome: `Arruela para barra roscada ${bitolaRosca}"`, quantidade: arruelas, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
  ];
}

function calcularEletroduto(trecho, regras) {
  const distancia = Number(trecho.distancia) || 0;
  const distanciaComPerda = distancia * (1 + regras.perdaEletrodutoPercent / 100);
  const tubos = Math.max(1, Math.ceil(distanciaComPerda / regras.barraEletrodutoM));
  const unioes = Math.max(tubos - 1, 0);
  const suportes = Math.max(1, Math.ceil(distancia / regras.espacamentoSuporteM));
  const parafusos = suportes * regras.parafusosPorSuporte;
  const porcas = suportes * regras.porcasPorSuporte;
  const arruelas = suportes * regras.arruelasPorSuporte;
  const conduletes = Math.floor(tubos / regras.tubosPorCondulete);
  const unidutsConicos = conduletes * regras.unidutsConicosPorCondulete;
  const tampasCega = conduletes * regras.tampasCegaPorCondulete;
  const moedasTampao = conduletes * regras.moedasTampaoPorCondulete;
  const dim = trecho.dimensao;
  const grupo = `Eletroduto ${dim}`;
  const itens = [
    { nome: `Eletroduto de zinco ${dim}`, quantidade: tubos, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    { nome: `Unidut reto tipo luva ${dim}`, quantidade: unioes, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    { nome: `Unidut cônico ${dim}`, quantidade: unidutsConicos, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
  ];
  if (conduletes > 0) {
    itens.push({ nome: `Caixa condulete múltipla de alumínio ${dim}`, quantidade: conduletes, unidade: "un", categoria: "Eletrodutos e conexões", grupo });
    itens.push({ nome: `Tampa cega para condulete ${dim}`, quantidade: tampasCega, unidade: "un", categoria: "Eletrodutos e conexões", grupo });
    itens.push({ nome: `Moeda tampão para condulete ${dim}`, quantidade: moedasTampao, unidade: "un", categoria: "Eletrodutos e conexões", grupo });
  }
  itens.push(
    { nome: `Abraçadeira tipo D com cunha ${dim}`, quantidade: suportes, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    { nome: `Parafuso com bucha (abraçadeira eletroduto ${dim})`, quantidade: parafusos, unidade: "un", categoria: "Eletrodutos e conexões", grupo }
  );
  return itens;
}

function calcularEletrocalha(trecho, regras) {
  const distancia = Number(trecho.distancia) || 0;
  const distanciaComPerda = distancia * (1 + regras.perdaCalhaPercent / 100);
  const pecas = Math.max(1, Math.ceil(distanciaComPerda / regras.barraCalhaM));
  const emendas = Math.max(pecas - 1, 0);
  const conjuntos = emendas * regras.conjuntosPorEmendaCalha;
  const suportes = Math.max(1, Math.ceil(distancia / regras.espacamentoSuporteCalhaM));
  const dim = trecho.dimensao;
  const grupo = `Eletrocalha perfurada ${dim}`;
  return [
    { nome: `Eletrocalha perfurada ${dim}`, quantidade: pecas, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    { nome: `Emenda tipo U para eletrocalha ${dim}`, quantidade: emendas, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    { nome: `Parafuso cabeça de lentilha auto travante 1/4"`, quantidade: conjuntos, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    { nome: `Porca sextavada 1/4"`, quantidade: conjuntos, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    { nome: `Arruela lisa 1/4"`, quantidade: conjuntos, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    { nome: `Suporte vertical tipo igrejinha ${dim}`, quantidade: suportes, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    ...itensBarraRoscada(trecho, regras, suportes, grupo),
  ];
}

function calcularLeito(trecho, regras) {
  const distancia = Number(trecho.distancia) || 0;
  const distanciaComPerda = distancia * (1 + regras.perdaLeitoPercent / 100);
  const pecas = Math.max(1, Math.ceil(distanciaComPerda / regras.barraLeitoM));
  const juncoes = Math.max(pecas - 1, 0);
  const emendas = juncoes * regras.emendasPorJuncaoLeito; // 4 emendas por junção, uma em cada extremidade
  const conjuntos = emendas * regras.parafusosPorEmendaLeito; // parafuso+arruela+porca por emenda
  const suportes = Math.max(1, Math.ceil(distancia / regras.espacamentoSuporteLeitoM));
  const dim = trecho.dimensao;
  const grupo = `Leito para cabos ${dim}`;
  return [
    { nome: `Leito para cabos ${dim}`, quantidade: pecas, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    { nome: `Emenda para leito ${dim}`, quantidade: emendas, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    { nome: `Parafuso cabeça de lentilha auto travante 3/8"`, quantidade: conjuntos, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    { nome: `Porca sextavada 3/8"`, quantidade: conjuntos, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    { nome: `Arruela lisa 3/8"`, quantidade: conjuntos, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    { nome: `Suporte tipo ômega ${dim}`, quantidade: suportes, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    ...itensBarraRoscada(trecho, regras, suportes, grupo),
  ];
}

function calcularPerfilado(trecho, regras) {
  const distancia = Number(trecho.distancia) || 0;
  const distanciaComPerda = distancia * (1 + regras.perdaPerfiladoPercent / 100);
  const pecas = Math.max(1, Math.ceil(distanciaComPerda / regras.barraPerfiladoM));
  const emendas = Math.max(pecas - 1, 0);
  const conjuntos = emendas * regras.conjuntosPorEmendaPerfilado;
  const suportes = Math.max(1, Math.ceil(distancia / regras.espacamentoSuportePerfiladoM));
  const dim = trecho.dimensao;
  const grupo = `Perfilado ${dim}`;
  return [
    { nome: `Perfilado ${dim}`, quantidade: pecas, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    { nome: `Emenda para perfilado ${dim}`, quantidade: emendas, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    { nome: `Parafuso cabeça de lentilha auto travante 3/8"`, quantidade: conjuntos, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    { nome: `Porca sextavada 3/8"`, quantidade: conjuntos, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    { nome: `Arruela lisa 3/8"`, quantidade: conjuntos, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    { nome: `Gancho curto para perfilado ${dim}`, quantidade: suportes, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    ...itensBarraRoscada(trecho, regras, suportes, grupo),
  ];
}

function calcularInfra(trecho, regras) {
  if (trecho.tipo === "eletrocalha") return calcularEletrocalha(trecho, regras);
  if (trecho.tipo === "leito") return calcularLeito(trecho, regras);
  if (trecho.tipo === "perfilado") return calcularPerfilado(trecho, regras);
  return calcularEletroduto(trecho, regras);
}

function calcularTomada(trecho, regras) {
  const qtd = Number(trecho.quantidade) || 0;
  if (trecho.tipo === "condulete") {
    const grupo = `Tomadas condulete ${trecho.bitola}`;
    const moedas = qtd * regras.moedasTampaoPorCaixaTomada;
    return [
      { nome: `Tomada 2P+T ${trecho.amperagem} ${trecho.cor} (condulete ${trecho.bitola})`, quantidade: qtd, unidade: "un", categoria: "Tomadas e interruptores", grupo },
      { nome: `Caixa condulete simples de alumínio ${trecho.bitola}`, quantidade: qtd, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
      { nome: `Moeda tampão para condulete ${trecho.bitola}`, quantidade: moedas, unidade: "un", categoria: "Eletrodutos e conexões", grupo },
    ];
  }
  if (trecho.tipo === "aquatic") {
    const grupo = "Tomadas Aquatic";
    return [
      { nome: `Tomada estanque 2P+T ${trecho.amperagem} Aquatic`, quantidade: qtd, unidade: "un", categoria: "Tomadas e interruptores", grupo },
      { nome: `Caixa estanque Aquatic`, quantidade: qtd, unidade: "un", categoria: "Tomadas e interruptores", grupo },
    ];
  }
  if (trecho.tipo === "industrial") {
    const grupo = "Tomadas industriais sobrepor";
    const nome =
      trecho.fase === "tri"
        ? `Tomada industrial sobrepor ${PADROES_TRIFASICO_INDUSTRIAL.find((p) => p.value === trecho.padraoTrifasico)?.label || ""}`
        : `Tomada industrial sobrepor 2P+T 16A 6H Azul`;
    return [{ nome, quantidade: qtd, unidade: "un", categoria: "Tomadas e interruptores", grupo }];
  }
  if (trecho.tipo === "pial") {
    const grupo = "Tomadas Pial de embutir";
    return [
      { nome: `Tomada 2P+T ${trecho.amperagem} Pial (embutir)`, quantidade: qtd, unidade: "un", categoria: "Tomadas e interruptores", grupo },
      { nome: `Caixa de embutir 4x2`, quantidade: qtd, unidade: "un", categoria: "Quadros e caixas", grupo },
    ];
  }
  return [];
}

function calcularMultipolar(trecho, regras) {
  const tipoObj = TIPOS_MULTIPOLAR.find((t) => t.value === trecho.tipo) || TIPOS_MULTIPOLAR[0];
  const distancia = Number(trecho.distancia) || 0;
  const qtd = Number(trecho.quantidade) || 1;
  const metros = round2((distancia * (1 + regras.perdaCabosPercent / 100) + regras.folgaCaboM) * qtd);
  const medida = `${trecho.vias}x${trecho.bitola}mm²`;
  const nome = tipoObj.value === "pp"
    ? `Cabo PP ${medida} 500V`
    : `Cabo blindado (shield) para alarme de incêndio ${medida}`;
  return [{ nome, quantidade: metros, unidade: "m", categoria: "Fios e cabos", grupo: tipoObj.value === "pp" ? `Cabos PP ${medida}` : `Cabos Shield ${medida}` }];
}

function chaveItem(categoria, nome, unidade) {
  return `${categoria}||${nome.trim().toLowerCase()}||${unidade}`;
}

function itensDoSetor(id) {
  const regras = { ...REGRAS_PADRAO, ...(lerDoSetor(id, "levantamento:regras") || {}), perdaCabosPercent: 0 };
  const status = lerDoSetor(id, "levantamento:statusAdquiridoCalc") || {};
  const mapa = new Map();
  const fontes = [
    ["levantamento:trechosCircuito", calcularCircuito],
    ["levantamento:trechosInfra", calcularInfra],
    ["levantamento:trechosTomada", calcularTomada],
    ["levantamento:trechosTerminal", calcularTerminal],
    ["levantamento:trechosMultipolar", calcularMultipolar],
  ];
  for (const [k, fn] of fontes) {
    for (const trecho of lerDoSetor(id, k) || []) {
      for (const it of fn(trecho, regras)) {
        const chave = chaveItem(it.categoria, it.nome, it.unidade);
        if (!mapa.has(chave)) mapa.set(chave, { ...it, quantidade: 0 });
        mapa.get(chave).quantidade = round2(mapa.get(chave).quantidade + it.quantidade);
      }
    }
  }
  const calc = Array.from(mapa.entries()).map(([chave, it]) => ({ ...it, id: chave, calculado: true, adquirido: !!status[chave] }));
  const manuais = (lerDoSetor(id, "levantamento:itens") || []).filter((i) => !i.trechoId && !i.origem && !i.calculado);
  return [...manuais, ...calc].sort(compararItens);
}

function agruparGeral(itens) {
  const grupos = new Map();
  for (const item of itens) {
    const grupo = item.grupo || item.categoria || "Outros materiais";
    if (!grupos.has(grupo)) grupos.set(grupo, new Map());
    const m = grupos.get(grupo);
    const chave = `${item.nome.trim().toLowerCase()}__${item.unidade}`;
    if (!m.has(chave)) m.set(chave, { nome: item.nome.trim(), unidade: item.unidade, quantidade: 0, adquirido: true });
    const a = m.get(chave);
    a.quantidade = round2(a.quantidade + item.quantidade);
    if (!item.adquirido) a.adquirido = false;
  }
  return Array.from(grupos.entries()).map(([grupo, m]) => ({ grupo, itens: Array.from(m.values()).sort(compararItens) })).sort((a, b) => a.grupo.localeCompare(b.grupo, "pt-BR"));
}

export default function LevantamentoEletrico() {
  const [obra, setObra] = useState("");
  const [itensManual, setItensManual] = useState([]);
  const [trechosCircuito, setTrechosCircuito] = useState([]);
  const [trechosInfra, setTrechosInfra] = useState([]);
  const [trechosTomada, setTrechosTomada] = useState([]);
  const [trechosTerminal, setTrechosTerminal] = useState([]);
  const [trechosMultipolar, setTrechosMultipolar] = useState([]);
  const [formMultipolar, setFormMultipolar] = useState({ tipo: "pp", vias: "3", bitola: "1,5", quantidade: "1" });
  const [editandoMultipolarId, setEditandoMultipolarId] = useState(null);
  const [regras, setRegras] = useState(REGRAS_PADRAO);
  const [statusAdquiridoCalc, setStatusAdquiridoCalc] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [novo, setNovo] = useState({});
  const [erro, setErro] = useState("");
  const [visao, setVisao] = useState("calculadora"); // 'categorias' | 'calculadora' | 'geral' | 'imprimir'
  const [tipoImpressao, setTipoImpressao] = useState("categorias");
  const [soPendentes, setSoPendentes] = useState(false);
  const [escopoImpressao, setEscopoImpressao] = useState("setor");
  const [perda, setPerda] = useState(0);
  const [mostrarRegras, setMostrarRegras] = useState(false);
  const [formCircuito, setFormCircuito] = useState({ tipo: "mono", bitola: "2,5", finalidade: "forca", cabosPorFase: "1" });
  const [formInfra, setFormInfra] = useState({ tipo: "eletroduto", dimensao: '3/4"', barraRoscada: "nao" });
  const [formTomada, setFormTomada] = useState({ tipo: "condulete", amperagem: "10A", cor: "Vermelha", fase: "mono" });
  const [formTerminal, setFormTerminal] = useState({ tipo: "mono", cabosPorFase: "1", bitola: "10mm" });
  const [editandoCircuitoId, setEditandoCircuitoId] = useState(null);
  const [editandoInfraId, setEditandoInfraId] = useState(null);
  const [editandoTomadaId, setEditandoTomadaId] = useState(null);
  const [editandoTerminalId, setEditandoTerminalId] = useState(null);
  const [editandoItemId, setEditandoItemId] = useState(null);
  const [itemEditDraft, setItemEditDraft] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const meta = await storage.get("levantamento:meta");
        if (meta) setObra(JSON.parse(meta.value).obra || "");
      } catch (e) {}
      try {
        const data = await storage.get("levantamento:itens");
        if (data) {
          const brutos = JSON.parse(data.value);
          // Limpa itens antigos gerados por circuitos/trechos de uma versão anterior do app
          // (hoje esses materiais são recalculados automaticamente, então itens salvos com
          // trechoId/origem eram duplicando a quantidade junto com o novo cálculo).
          const limpos = brutos.filter((i) => !i.trechoId && !i.origem && !i.calculado);
          setItensManual(limpos);
        }
      } catch (e) {}
      try {
        const tc = await storage.get("levantamento:trechosCircuito");
        if (tc) setTrechosCircuito(JSON.parse(tc.value));
      } catch (e) {}
      try {
        const ti = await storage.get("levantamento:trechosInfra");
        if (ti) setTrechosInfra(JSON.parse(ti.value));
      } catch (e) {}
      try {
        const tt = await storage.get("levantamento:trechosTomada");
        if (tt) setTrechosTomada(JSON.parse(tt.value));
      } catch (e) {}
      try {
        const tm = await storage.get("levantamento:trechosTerminal");
        if (tm) setTrechosTerminal(JSON.parse(tm.value));
      } catch (e) {}
      try {
        const mp = await storage.get("levantamento:trechosMultipolar");
        if (mp) setTrechosMultipolar(JSON.parse(mp.value));
      } catch (e) {}
      try {
        const rg = await storage.get("levantamento:regras");
        if (rg) setRegras({ ...REGRAS_PADRAO, ...JSON.parse(rg.value), perdaCabosPercent: 0 });
      } catch (e) {}
      try {
        const sa = await storage.get("levantamento:statusAdquiridoCalc");
        if (sa) setStatusAdquiridoCalc(JSON.parse(sa.value));
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    storage.set("levantamento:meta", JSON.stringify({ obra })).catch(() => setErro("Não foi possível salvar os dados agora."));
  }, [obra, loaded]);
  useEffect(() => {
    if (!loaded) return;
    storage.set("levantamento:itens", JSON.stringify(itensManual)).catch(() => setErro("Não foi possível salvar os dados agora."));
  }, [itensManual, loaded]);
  useEffect(() => {
    if (!loaded) return;
    storage.set("levantamento:trechosCircuito", JSON.stringify(trechosCircuito)).catch(() => {});
  }, [trechosCircuito, loaded]);
  useEffect(() => {
    if (!loaded) return;
    storage.set("levantamento:trechosInfra", JSON.stringify(trechosInfra)).catch(() => {});
  }, [trechosInfra, loaded]);
  useEffect(() => {
    if (!loaded) return;
    storage.set("levantamento:trechosTomada", JSON.stringify(trechosTomada)).catch(() => {});
  }, [trechosTomada, loaded]);
  useEffect(() => {
    if (!loaded) return;
    storage.set("levantamento:trechosTerminal", JSON.stringify(trechosTerminal)).catch(() => {});
  }, [trechosTerminal, loaded]);
  useEffect(() => {
    if (!loaded) return;
    storage.set("levantamento:trechosMultipolar", JSON.stringify(trechosMultipolar)).catch(() => {});
  }, [trechosMultipolar, loaded]);
  useEffect(() => {
    if (!loaded) return;
    storage.set("levantamento:regras", JSON.stringify(regras)).catch(() => {});
  }, [regras, loaded]);
  useEffect(() => {
    if (!loaded) return;
    storage.set("levantamento:statusAdquiridoCalc", JSON.stringify(statusAdquiridoCalc)).catch(() => {});
  }, [statusAdquiridoCalc, loaded]);

  // Itens calculados: agregados por categoria+nome+unidade, somando todos os circuitos/trechos.
  const itensCalculados = useMemo(() => {
    const mapa = new Map();
    for (const trecho of trechosCircuito) {
      for (const it of calcularCircuito(trecho, regras)) {
        const chave = chaveItem(it.categoria, it.nome, it.unidade);
        if (!mapa.has(chave)) mapa.set(chave, { ...it, quantidade: 0 });
        mapa.get(chave).quantidade = round2(mapa.get(chave).quantidade + it.quantidade);
      }
    }
    for (const trecho of trechosInfra) {
      for (const it of calcularInfra(trecho, regras)) {
        const chave = chaveItem(it.categoria, it.nome, it.unidade);
        if (!mapa.has(chave)) mapa.set(chave, { ...it, quantidade: 0 });
        mapa.get(chave).quantidade = round2(mapa.get(chave).quantidade + it.quantidade);
      }
    }
    for (const trecho of trechosTomada) {
      for (const it of calcularTomada(trecho, regras)) {
        const chave = chaveItem(it.categoria, it.nome, it.unidade);
        if (!mapa.has(chave)) mapa.set(chave, { ...it, quantidade: 0 });
        mapa.get(chave).quantidade = round2(mapa.get(chave).quantidade + it.quantidade);
      }
    }
    for (const trecho of trechosTerminal) {
      for (const it of calcularTerminal(trecho, regras)) {
        const chave = chaveItem(it.categoria, it.nome, it.unidade);
        if (!mapa.has(chave)) mapa.set(chave, { ...it, quantidade: 0 });
        mapa.get(chave).quantidade = round2(mapa.get(chave).quantidade + it.quantidade);
      }
    }
    for (const trecho of trechosMultipolar) {
      for (const it of calcularMultipolar(trecho, regras)) {
        const chave = chaveItem(it.categoria, it.nome, it.unidade);
        if (!mapa.has(chave)) mapa.set(chave, { ...it, quantidade: 0 });
        mapa.get(chave).quantidade = round2(mapa.get(chave).quantidade + it.quantidade);
      }
    }
    return Array.from(mapa.entries()).map(([chave, it]) => ({
      ...it,
      id: chave,
      calculado: true,
      adquirido: !!statusAdquiridoCalc[chave],
    }));
  }, [trechosCircuito, trechosInfra, trechosTomada, trechosTerminal, trechosMultipolar, regras, statusAdquiridoCalc]);

  // Anúncio para leitores de tela quando os resultados calculados mudam
  const [anuncioCalc, setAnuncioCalc] = useState("");
  const calcInicial = useRef(true);
  useEffect(() => {
    if (calcInicial.current) { calcInicial.current = false; return; }
    const t = setTimeout(() => {
      const n = itensCalculados.length;
      setAnuncioCalc(n === 0 ? "Resultados da calculadora atualizados: nenhum material calculado." : `Resultados da calculadora atualizados: ${n} ${n === 1 ? "material calculado" : "materiais calculados"}.`);
    }, 600);
    return () => clearTimeout(t);
  }, [itensCalculados]);

  const itensCombinados = useMemo(
    () => [...itensManual, ...itensCalculados].sort(compararItens),
    [itensManual, itensCalculados]
  );

  const categorias = [
    ...CATEGORIAS_PADRAO,
    ...Array.from(new Set(itensCombinados.map((i) => i.categoria).filter((c) => !CATEGORIAS_PADRAO.includes(c)))),
  ];

  const totalItens = itensCombinados.length;
  const totalAdquiridos = itensCombinados.filter((i) => i.adquirido).length;

  const listaGeralAgrupada = useMemo(() => {
    const grupos = new Map();
    for (const item of itensCombinados) {
      const grupo = item.grupo || item.categoria || "Outros materiais";
      if (!grupos.has(grupo)) grupos.set(grupo, new Map());
      const mapaGrupo = grupos.get(grupo);
      const chave = `${item.nome.trim().toLowerCase()}__${item.unidade}`;
      if (!mapaGrupo.has(chave)) {
        mapaGrupo.set(chave, { nome: item.nome.trim(), unidade: item.unidade, quantidade: 0, adquirido: true });
      }
      const atual = mapaGrupo.get(chave);
      atual.quantidade = round2(atual.quantidade + item.quantidade);
      if (!item.adquirido) atual.adquirido = false;
    }
    return Array.from(grupos.entries())
      .map(([grupo, mapaGrupo]) => ({
        grupo,
        itens: Array.from(mapaGrupo.values()).sort(compararItens),
      }))
      .sort((a, b) => a.grupo.localeCompare(b.grupo, "pt-BR"));
  }, [itensCombinados]);

  function addItem(categoria) {
    const rascunho = novo[categoria];
    if (!rascunho || !rascunho.nome || !rascunho.quantidade) return;
    setItensManual((prev) => [
      ...prev,
      {
        id: uid(),
        categoria,
        nome: rascunho.nome.trim(),
        quantidade: Number(rascunho.quantidade),
        unidade: rascunho.unidade || "un",
        adquirido: false,
        grupo: categoria,
      },
    ]);
    setNovo((prev) => ({ ...prev, [categoria]: { unidade: rascunho.unidade } }));
  }

  function updateNovo(categoria, campo, valor) {
    setNovo((prev) => ({ ...prev, [categoria]: { ...prev[categoria], [campo]: valor } }));
  }

  function removeItemManual(id) {
    setItensManual((prev) => prev.filter((i) => i.id !== id));
    if (editandoItemId === id) setEditandoItemId(null);
  }

  function toggleAdquirido(item) {
    if (item.calculado) {
      setStatusAdquiridoCalc((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
    } else {
      setItensManual((prev) => prev.map((i) => (i.id === item.id ? { ...i, adquirido: !i.adquirido } : i)));
    }
  }

  function editarItemManual(item) {
    setEditandoItemId(item.id);
    setItemEditDraft({ nome: item.nome, quantidade: item.quantidade, unidade: item.unidade });
  }

  function salvarItemManual(id) {
    if (!itemEditDraft.nome || !itemEditDraft.quantidade) return;
    setItensManual((prev) =>
      prev.map((i) => (i.id === id ? { ...i, nome: itemEditDraft.nome.trim(), quantidade: Number(itemEditDraft.quantidade), unidade: itemEditDraft.unidade || "un" } : i))
    );
    setEditandoItemId(null);
  }

  function cancelarEdicaoItem() {
    setEditandoItemId(null);
  }

  function salvarMultipolar() {
    const distancia = Number(formMultipolar.distancia);
    if (!distancia || distancia <= 0 || !formMultipolar.vias || !formMultipolar.bitola) return;
    const quantidade = Number(formMultipolar.quantidade) || 1;
    const nome = formMultipolar.nome?.trim() || `Trecho ${trechosMultipolar.length + 1}`;
    const dados = { nome, distancia, quantidade, tipo: formMultipolar.tipo, vias: formMultipolar.vias, bitola: formMultipolar.bitola };
    if (editandoMultipolarId) {
      setTrechosMultipolar((prev) => prev.map((t) => (t.id === editandoMultipolarId ? { ...t, ...dados } : t)));
      setEditandoMultipolarId(null);
    } else {
      setTrechosMultipolar((prev) => [...prev, { id: uid(), ...dados }]);
    }
    setFormMultipolar({ tipo: dados.tipo, vias: dados.vias, bitola: dados.bitola, quantidade: "1" });
  }

  function trocarTipoMultipolar(tipo) {
    const t = TIPOS_MULTIPOLAR.find((x) => x.value === tipo);
    setFormMultipolar((p) => ({ ...p, tipo, vias: t.padraoVias, bitola: t.padraoBitola }));
  }

  function adicionarTrechoCircuito() {
    const distancia = Number(formCircuito.distancia);
    if (!distancia || distancia <= 0 || !formCircuito.bitola) return;
    const nomeCircuito = formCircuito.nome?.trim() || `Circuito ${trechosCircuito.length + 1}`;
    const cabosPorFase = Number(formCircuito.cabosPorFase) || 1;
    if (editandoCircuitoId) {
      setTrechosCircuito((prev) =>
        prev.map((t) =>
          t.id === editandoCircuitoId
            ? { ...t, nome: nomeCircuito, distancia, tipo: formCircuito.tipo, bitola: formCircuito.bitola, finalidade: formCircuito.finalidade, cabosPorFase }
            : t
        )
      );
      setEditandoCircuitoId(null);
    } else {
      const trechoId = uid();
      setTrechosCircuito((prev) => [
        ...prev,
        { id: trechoId, nome: nomeCircuito, distancia, tipo: formCircuito.tipo, bitola: formCircuito.bitola, finalidade: formCircuito.finalidade, cabosPorFase },
      ]);
    }
    setFormCircuito({ tipo: formCircuito.tipo, bitola: formCircuito.bitola, finalidade: formCircuito.finalidade, cabosPorFase: formCircuito.cabosPorFase });
  }

  function editarTrechoCircuito(t) {
    setEditandoCircuitoId(t.id);
    setFormCircuito({ nome: t.nome, distancia: String(t.distancia), tipo: t.tipo, bitola: t.bitola, finalidade: t.finalidade, cabosPorFase: String(t.cabosPorFase || 1) });
  }

  function cancelarEdicaoCircuito() {
    setEditandoCircuitoId(null);
    setFormCircuito({ tipo: "mono", bitola: "2,5", finalidade: "forca", cabosPorFase: "1" });
  }

  function removerTrechoCircuito(id) {
    setTrechosCircuito((prev) => prev.filter((t) => t.id !== id));
    if (editandoCircuitoId === id) cancelarEdicaoCircuito();
  }

  function adicionarTrechoInfra() {
    const distancia = Number(formInfra.distancia);
    if (!distancia || distancia <= 0 || !formInfra.dimensao) return;
    const nomeTrecho = formInfra.nome?.trim() || `Trecho ${trechosInfra.length + 1}`;
    if (editandoInfraId) {
      setTrechosInfra((prev) =>
        prev.map((t) =>
          t.id === editandoInfraId
            ? { ...t, nome: nomeTrecho, distancia, dimensao: formInfra.dimensao, tipo: formInfra.tipo, barraRoscada: formInfra.barraRoscada || "nao" }
            : t
        )
      );
      setEditandoInfraId(null);
    } else {
      const trechoId = uid();
      setTrechosInfra((prev) => [
        ...prev,
        { id: trechoId, nome: nomeTrecho, distancia, dimensao: formInfra.dimensao, tipo: formInfra.tipo, barraRoscada: formInfra.barraRoscada || "nao" },
      ]);
    }
    setFormInfra({ tipo: formInfra.tipo, dimensao: formInfra.dimensao, barraRoscada: formInfra.barraRoscada });
  }

  function editarTrechoInfra(t) {
    setEditandoInfraId(t.id);
    setFormInfra({ nome: t.nome, distancia: String(t.distancia), dimensao: t.dimensao, tipo: t.tipo, barraRoscada: t.barraRoscada || "nao" });
  }

  function cancelarEdicaoInfra() {
    setEditandoInfraId(null);
    setFormInfra({ tipo: "eletroduto", dimensao: '3/4"', barraRoscada: "nao" });
  }

  function removerTrechoInfra(id) {
    setTrechosInfra((prev) => prev.filter((t) => t.id !== id));
    if (editandoInfraId === id) cancelarEdicaoInfra();
  }

  function adicionarTrechoTomada() {
    const quantidade = Number(formTomada.quantidade);
    if (!quantidade || quantidade <= 0) return;
    if (formTomada.tipo === "condulete" && !formTomada.bitola) return;
    if (formTomada.tipo === "industrial" && formTomada.fase === "tri" && !formTomada.padraoTrifasico) return;
    if (editandoTomadaId) {
      const nomeTomada = formTomada.nome?.trim() || "Tomadas";
      setTrechosTomada((prev) => prev.map((t) => (t.id === editandoTomadaId ? { id: t.id, nome: nomeTomada, quantidade, ...formTomada } : t)));
      setEditandoTomadaId(null);
    } else {
      const trechoId = uid();
      const nomeTomada = formTomada.nome?.trim() || `Tomadas ${trechosTomada.length + 1}`;
      setTrechosTomada((prev) => [...prev, { id: trechoId, nome: nomeTomada, quantidade, ...formTomada }]);
    }
    setFormTomada((p) => ({ ...p, nome: "", quantidade: "" }));
  }

  function editarTrechoTomada(t) {
    setEditandoTomadaId(t.id);
    setFormTomada({ ...t, quantidade: String(t.quantidade) });
  }

  function cancelarEdicaoTomada() {
    setEditandoTomadaId(null);
    setFormTomada({ tipo: "condulete", amperagem: "10A", cor: "Vermelha", fase: "mono" });
  }

  function removerTrechoTomada(id) {
    setTrechosTomada((prev) => prev.filter((t) => t.id !== id));
    if (editandoTomadaId === id) cancelarEdicaoTomada();
  }

  function adicionarTrechoTerminal() {
    if (!formTerminal.bitola) return;
    const cabosPorFase = Number(formTerminal.cabosPorFase) || 1;
    if (editandoTerminalId) {
      const nomeTerminal = formTerminal.nome?.trim() || "Terminais";
      setTrechosTerminal((prev) =>
        prev.map((t) =>
          t.id === editandoTerminalId ? { id: t.id, nome: nomeTerminal, tipo: formTerminal.tipo, cabosPorFase, bitola: formTerminal.bitola } : t
        )
      );
      setEditandoTerminalId(null);
    } else {
      const trechoId = uid();
      const nomeTerminal = formTerminal.nome?.trim() || `Terminais ${trechosTerminal.length + 1}`;
      setTrechosTerminal((prev) => [
        ...prev,
        { id: trechoId, nome: nomeTerminal, tipo: formTerminal.tipo, cabosPorFase, bitola: formTerminal.bitola },
      ]);
    }
    setFormTerminal({ tipo: formTerminal.tipo, cabosPorFase: formTerminal.cabosPorFase, bitola: formTerminal.bitola });
  }

  function editarTrechoTerminal(t) {
    setEditandoTerminalId(t.id);
    setFormTerminal({ nome: t.nome, tipo: t.tipo, cabosPorFase: String(t.cabosPorFase || 1), bitola: t.bitola });
  }

  function cancelarEdicaoTerminal() {
    setEditandoTerminalId(null);
    setFormTerminal({ tipo: "mono", cabosPorFase: "1", bitola: "10mm" });
  }

  function removerTrechoTerminal(id) {
    setTrechosTerminal((prev) => prev.filter((t) => t.id !== id));
    if (editandoTerminalId === id) cancelarEdicaoTerminal();
  }

  function exportarCSV() {
    let header, linhas;
    if (visao === "geral") {
      header = "Grupo,Item,Quantidade,Unidade,Adquirido\n";
      linhas = listaGeralAgrupada
        .flatMap((g) => g.itens.map((i) => [g.grupo, i.nome, i.quantidade, i.unidade, i.adquirido ? "sim" : "não"]))
        .map((cols) => cols.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");
    } else {
      header = "Categoria,Item,Quantidade,Unidade,Adquirido\n";
      linhas = itensCombinados
        .map((i) => [i.categoria, i.nome, i.quantidade, i.unidade, i.adquirido ? "sim" : "não"].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");
    }
    const blob = new Blob([header + linhas], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const sufixo = visao === "geral" ? "lista-geral" : "por-categoria";
    a.download = `${sufixo}-${(obra || "material-eletrico").replace(/\s+/g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function atualizarRegra(campo, valor) {
    setRegras((prev) => ({ ...prev, [campo]: Number(valor) }));
  }

  async function limparLevantamento() {
    const confirmado = window.confirm(
      "Isso vai apagar a obra, todos os itens lançados, circuitos, trechos de infraestrutura, tomadas e terminais calculados. Os parâmetros de cálculo (folgas, perdas, espaçamentos) são mantidos. Confirma?"
    );
    if (!confirmado) return;
    setObra("");
    setItensManual([]);
    setTrechosCircuito([]);
    setTrechosInfra([]);
    setTrechosTomada([]);
    setTrechosTerminal([]);
    setTrechosMultipolar([]);
    setStatusAdquiridoCalc({});
    try {
      await storage.delete("levantamento:meta");
      await storage.delete("levantamento:itens");
      await storage.delete("levantamento:trechosCircuito");
      await storage.delete("levantamento:trechosInfra");
      await storage.delete("levantamento:trechosTomada");
      await storage.delete("levantamento:trechosTerminal");
      await storage.delete("levantamento:trechosMultipolar");
      await storage.delete("levantamento:statusAdquiridoCalc");
    } catch (e) {
      // chaves podem já não existir; sem problema
    }
  }

  return (
    <div className="app-raiz"
      style={{
        "--bg": "#F5F5F2",
        "--panel": "#FFFFFF",
        "--ink": "#1B1F23",
        "--ink-soft": "#5B6166",
        "--rule": "#D8D8D2",
        "--yellow": "#F2B705",
        "--blue": "#1D4E66",
        "--green": "#2F7A4B",
        "--red": "#B23A1F",
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        background: "var(--bg)",
        color: "var(--ink)",
        minHeight: "100vh",
        padding: "0 0 64px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        input, select {
          font-family: 'IBM Plex Mono', monospace;
          background: #FBFBFA;
          border: 1px solid var(--rule);
          border-radius: 3px;
          padding: 7px 9px;
          font-size: 14px;
          color: var(--ink);
        }
        input:focus, select:focus { outline: 2px solid var(--blue); outline-offset: 1px; }
        input[type="text"]#obra-nome { font-family: 'Space Grotesk', sans-serif; }
        button { cursor: pointer; }
        button:focus-visible, input:focus-visible, select:focus-visible, a:focus-visible, textarea:focus-visible, [tabindex]:focus-visible { outline: 3px solid #FFB000 !important; outline-offset: 2px; box-shadow: 0 0 0 5px #1C1F22; position: relative; z-index: 1; }
        label.campo { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--ink-soft); }
        details.modulo { border: 1px solid #DDD; border-radius: 6px; background: #fff; padding: 10px 12px; }
        details.modulo > summary { cursor: pointer; list-style: none; display: flex; align-items: center; gap: 8px; }
        details.modulo > summary::-webkit-details-marker { display: none; }
        details.modulo > summary::after { content: "▾"; margin-left: auto; font-size: 18px; transition: transform .2s; }
        details.modulo:not([open]) > summary::after { transform: rotate(-90deg); }
        details.modulo[open] > summary { margin-bottom: 10px; }
        .barra-inferior { display: none; }
        @media (max-width: 767px) {
          .abas-topo { display: none !important; }
          .barra-inferior { display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; background: #1C1F22; border-top: 1px solid #4A4F54; padding-bottom: env(safe-area-inset-bottom); }
          .barra-inferior button { flex: 1; background: transparent; border: none; color: #9AA0A4; padding: 8px 2px; min-height: 56px; display: flex; flex-direction: column; align-items: center; gap: 3px; font-size: 11px; }
          .barra-inferior button[aria-pressed="true"] { color: #FFB000; font-weight: 700; }
          .app-raiz { padding-bottom: 72px; }
        }
        @media print { details.modulo { border: none; } details.modulo > summary::after { display: none; } }
        @media print { .no-print { display: none !important; } body { background: white; } }
      `}</style>

      <nav className="barra-inferior no-print" aria-label="Seções do app">
        {[["calculadora","Calculadora",Calculator],["categorias","Itens",LayoutGrid],["geral","Geral",List],["imprimir","Imprimir",Printer]].map(([v,t,I]) => (
          <button key={v} aria-pressed={visao === v} onClick={() => { setVisao(v); window.scrollTo(0, 0); }}><I size={20} aria-hidden="true" />{t}</button>
        ))}
      </nav>
      <div
        className="no-print"
        style={{
          position: "relative", background: "var(--ink)", color: "#F5F5F2",
          padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Zap size={20} style={{ color: "var(--yellow)", flexShrink: 0 }} />
          <input
            id="obra-nome" type="text" placeholder="Nome da obra" value={obra} onChange={(e) => setObra(e.target.value)}
            style={{ background: "transparent", border: "none", borderBottom: "1px solid #4A4F54", color: "#F5F5F2", fontSize: 17, fontWeight: 600, padding: "4px 2px", minWidth: 160, maxWidth: 280 }}
          />
        </div>
        <div style={{ display: "flex", gap: 18, alignItems: "center", fontSize: 13, flexWrap: "wrap" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#9AA0A4" }}>Itens</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{totalAdquiridos}/{totalItens}</div>
          </div>
          <div role="group" aria-label="Seções do app" className="abas-topo" style={{ display: "flex", border: "1px solid #4A4F54", borderRadius: 4, overflow: "hidden" }}>
            <button aria-pressed={visao === "calculadora"} onClick={() => setVisao("calculadora")} title="Calculadora de cabos e infraestrutura" aria-label="Calculadora de cabos e infraestrutura" style={{ background: visao === "calculadora" ? "#F5F5F2" : "transparent", color: visao === "calculadora" ? "var(--ink)" : "#F5F5F2", border: "none", padding: "7px 10px", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <Calculator size={16} /> Calculadora
            </button>
            <button aria-pressed={visao === "categorias"} onClick={() => setVisao("categorias")} title="Ver por categoria" aria-label="Ver por categoria" style={{ background: visao === "categorias" ? "#F5F5F2" : "transparent", color: visao === "categorias" ? "var(--ink)" : "#F5F5F2", border: "none", padding: "7px 10px", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <LayoutGrid size={16} /> Itens
            </button>
            <button aria-pressed={visao === "geral"} onClick={() => setVisao("geral")} title="Ver lista geral" aria-label="Ver lista geral" style={{ background: visao === "geral" ? "#F5F5F2" : "transparent", color: visao === "geral" ? "var(--ink)" : "#F5F5F2", border: "none", padding: "7px 10px", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <List size={16} /> Geral
            </button>
            <button aria-pressed={visao === "imprimir"} onClick={() => setVisao("imprimir")} title="Imprimir listas em PDF" aria-label="Imprimir listas em PDF" style={{ background: visao === "imprimir" ? "#F5F5F2" : "transparent", color: visao === "imprimir" ? "var(--ink)" : "#F5F5F2", border: "none", padding: "7px 10px", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <Printer size={16} /> Imprimir
            </button>
          </div>
        </div>
      </div>

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{anuncioCalc}</div>
      {erro && <div className="no-print" style={{ margin: "10px 20px 0", fontSize: 13, color: "var(--red)" }}>{erro}</div>}

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <img src={logoAsset.url} alt="Logo Eletron Watts Construções" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6 }} />
          <div style={{ fontWeight: 700, fontSize: 16 }}>Eletron Watts Construções</div>
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 600, margin: "0 0 4px" }}>
          Levantamento de material elétrico
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: "0 0 28px" }}>
          {visao === "categorias" && "Cabos e infraestrutura calculados aparecem já somados por bitola/cor ou dimensão. Adicione manualmente o restante dos materiais."}
          {visao === "calculadora" && "Informe a distância linear do circuito ou da infraestrutura — o resto é calculado para você."}
          {visao === "imprimir" && "Escolha a lista, confira a prévia e clique em Gerar PDF. Na janela que abrir, selecione \"Salvar como PDF\". Ou envie a lista direto pelo WhatsApp."}
          {visao === "geral" && "Lista consolidada: itens iguais aparecem somados, organizados por bitola/dimensão."}
        </p>

        {visao === "categorias" &&
          categorias.map((categoria) => {
            const itensCategoria = itensCombinados.filter((i) => i.categoria === categoria);
            const rascunho = novo[categoria] || {};
            return (
              <section key={categoria} style={{ marginBottom: 22 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderLeft: "4px solid var(--yellow)", paddingLeft: 10, marginBottom: 8 }}>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, margin: 0 }}>{categoria}</h2>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "var(--ink-soft)" }}>
                    {itensCategoria.length} {itensCategoria.length === 1 ? "item" : "itens"}
                  </span>
                </div>
                <div style={{ borderTop: "1px solid var(--rule)" }}>
                  {itensCategoria.map((item) =>
                    editandoItemId === item.id ? (
                      <div key={item.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--rule)", flexWrap: "wrap" }}>
                        <input type="text" value={itemEditDraft.nome || ""} onChange={(e) => setItemEditDraft((p) => ({ ...p, nome: e.target.value }))} style={{ flex: "2 1 160px", minWidth: 120 }} />
                        <input type="number" value={itemEditDraft.quantidade || ""} onChange={(e) => setItemEditDraft((p) => ({ ...p, quantidade: e.target.value }))} style={{ width: 72 }} min="0" />
                        <select value={itemEditDraft.unidade || "un"} onChange={(e) => setItemEditDraft((p) => ({ ...p, unidade: e.target.value }))} style={{ width: 66 }}>
                          {UNIDADES.map((u) => (<option key={u} value={u}>{u}</option>))}
                        </select>
                        <button className="no-print" onClick={() => salvarItemManual(item.id)} title="Salvar" aria-label="Salvar" style={{ background: "var(--green)", border: "none", borderRadius: 4, color: "white", padding: 6, display: "flex" }}>
                          <Check size={14} />
                        </button>
                        <button className="no-print" onClick={cancelarEdicaoItem} title="Cancelar" aria-label="Cancelar" style={{ background: "transparent", border: "1px solid var(--rule)", borderRadius: 4, color: "var(--ink-soft)", padding: 6, display: "flex" }}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div key={item.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--rule)", fontSize: 14, opacity: item.adquirido ? 0.55 : 1 }}>
                        <button className="no-print" onClick={() => toggleAdquirido(item)} title={item.adquirido ? "Marcar como pendente" : "Marcar como adquirido"} aria-label={item.adquirido ? "Marcar como pendente" : "Marcar como adquirido"} style={{ width: 22, height: 22, borderRadius: 4, border: `1px solid ${item.adquirido ? "var(--green)" : "var(--rule)"}`, background: item.adquirido ? "var(--green)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                          {item.adquirido && <Check size={13} />}
                        </button>
                        <span style={{ textDecoration: item.adquirido ? "line-through" : "none" }}>
                          {item.nome}
                          {item.calculado && <span style={{ color: "var(--ink-soft)", fontSize: 11 }}> · calculado</span>}
                        </span>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--ink-soft)", minWidth: 70, textAlign: "right" }}>
                          {item.quantidade} {item.unidade}
                        </span>
                        {item.calculado ? (
                          <span style={{ width: 15 }} />
                        ) : (
                          <button className="no-print" onClick={() => editarItemManual(item)} title="Editar" aria-label="Editar" style={{ background: "transparent", border: "none", color: "var(--ink-soft)", padding: 4, display: "flex" }}>
                            <Pencil size={15} />
                          </button>
                        )}
                        {item.calculado ? (
                          <span style={{ width: 15 }} />
                        ) : (
                          <button className="no-print" onClick={() => removeItemManual(item.id)} title="Remover" aria-label="Remover" style={{ background: "transparent", border: "none", color: "var(--ink-soft)", padding: 4, display: "flex" }}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    )
                  )}
                  {itensCategoria.length === 0 && <p style={{ color: "var(--ink-soft)", fontSize: 13, padding: "10px 0" }}>Nenhum item ainda nesta categoria.</p>}
                </div>
                <div className="no-print" style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                  {categoria === "Fixação e parafusos" && <datalist id="sug-fixacao">{SUGESTOES_FIXACAO.map((n) => <option key={n} value={n} />)}</datalist>}
                  <input type="text" list={categoria === "Fixação e parafusos" ? "sug-fixacao" : undefined} placeholder={categoria === "Fixação e parafusos" ? "Toque para ver os parafusos" : "Nome do material"} value={rascunho.nome || ""} onChange={(e) => updateNovo(categoria, "nome", e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem(categoria)} style={{ flex: "2 1 180px", minWidth: 140 }} />
                  <input type="number" placeholder="Qtd." value={rascunho.quantidade || ""} onChange={(e) => updateNovo(categoria, "quantidade", e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem(categoria)} style={{ width: 72 }} min="0" />
                  <select value={rascunho.unidade || "un"} onChange={(e) => updateNovo(categoria, "unidade", e.target.value)} style={{ width: 66 }}>
                    {UNIDADES.map((u) => (<option key={u} value={u}>{u}</option>))}
                  </select>
                  <button onClick={() => addItem(categoria)} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--blue)", color: "white", border: "none", borderRadius: 3, padding: "8px 12px", fontSize: 13, fontWeight: 500 }}>
                    <Plus size={14} /> Adicionar
                  </button>
                </div>
              </section>
            );
          })}

        {visao === "categorias" && (
          <NovaCategoria onAdd={(nome) => setNovo((prev) => ({ ...prev, [nome]: {} }))} categorias={categorias} />
        )}

        {visao === "calculadora" && (
          <div>
            <button
              className="no-print"
              onClick={() => setMostrarRegras((v) => !v)}
              aria-expanded={mostrarRegras}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid var(--rule)", borderRadius: 3, padding: "7px 10px", fontSize: 13, color: "var(--ink-soft)", marginBottom: 20 }}
            >
              <Settings2 size={14} /> Parâmetros de cálculo
              {mostrarRegras ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {mostrarRegras && (
              <div style={{ background: "var(--panel)", border: "1px solid var(--rule)", borderRadius: 4, padding: 16, marginBottom: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                <p style={{ gridColumn: "1 / -1", fontSize: 12, fontWeight: 600, margin: "0 0 -2px", color: "var(--ink)" }}>Cabos</p>
                <label className="campo">Folga por circuito (m)
                  <input type="number" step="0.1" value={regras.folgaCaboM} onChange={(e) => atualizarRegra("folgaCaboM", e.target.value)} />
                </label>
                <p style={{ gridColumn: "1 / -1", fontSize: 11, margin: 0, color: "var(--muted, #6B7075)" }}>A margem de perda dos cabos é escolhida uma única vez na aba Imprimir (0%, 3%, 5% ou 10%).</p>

                <p style={{ gridColumn: "1 / -1", fontSize: 12, fontWeight: 600, margin: "10px 0 -2px", color: "var(--ink)" }}>Eletroduto (zinco)</p>
                <label className="campo">Barra de eletroduto (m)
                  <input type="number" step="0.1" value={regras.barraEletrodutoM} onChange={(e) => atualizarRegra("barraEletrodutoM", e.target.value)} />
                </label>
                <label className="campo">Espaçamento entre abraçadeiras (m)
                  <input type="number" step="0.1" value={regras.espacamentoSuporteM} onChange={(e) => atualizarRegra("espacamentoSuporteM", e.target.value)} />
                </label>
                <label className="campo">Parafusos por abraçadeira
                  <input type="number" step="1" value={regras.parafusosPorSuporte} onChange={(e) => atualizarRegra("parafusosPorSuporte", e.target.value)} />
                </label>
                <label className="campo">Porcas por abraçadeira
                  <input type="number" step="1" value={regras.porcasPorSuporte} onChange={(e) => atualizarRegra("porcasPorSuporte", e.target.value)} />
                </label>
                <label className="campo">Arruelas por abraçadeira
                  <input type="number" step="1" value={regras.arruelasPorSuporte} onChange={(e) => atualizarRegra("arruelasPorSuporte", e.target.value)} />
                </label>
                <label className="campo">Perda de eletroduto (%)
                  <input type="number" step="1" value={regras.perdaEletrodutoPercent} onChange={(e) => atualizarRegra("perdaEletrodutoPercent", e.target.value)} />
                </label>
                <label className="campo">Barras por condulete
                  <input type="number" step="1" value={regras.tubosPorCondulete} onChange={(e) => atualizarRegra("tubosPorCondulete", e.target.value)} />
                </label>
                <label className="campo">Unidut cônico por condulete
                  <input type="number" step="1" value={regras.unidutsConicosPorCondulete} onChange={(e) => atualizarRegra("unidutsConicosPorCondulete", e.target.value)} />
                </label>
                <label className="campo">Tampa cega por condulete
                  <input type="number" step="1" value={regras.tampasCegaPorCondulete} onChange={(e) => atualizarRegra("tampasCegaPorCondulete", e.target.value)} />
                </label>
                <label className="campo">Moeda tampão por condulete
                  <input type="number" step="1" value={regras.moedasTampaoPorCondulete} onChange={(e) => atualizarRegra("moedasTampaoPorCondulete", e.target.value)} />
                </label>

                <p style={{ gridColumn: "1 / -1", fontSize: 12, fontWeight: 600, margin: "10px 0 -2px", color: "var(--ink)" }}>Eletrocalha perfurada</p>
                <label className="campo">Barra de eletrocalha (m)
                  <input type="number" step="0.1" value={regras.barraCalhaM} onChange={(e) => atualizarRegra("barraCalhaM", e.target.value)} />
                </label>
                <label className="campo">Espaçamento entre suportes (m)
                  <input type="number" step="0.1" value={regras.espacamentoSuporteCalhaM} onChange={(e) => atualizarRegra("espacamentoSuporteCalhaM", e.target.value)} />
                </label>
                <label className="campo">Parafuso+porca+arruela por emenda
                  <input type="number" step="1" value={regras.conjuntosPorEmendaCalha} onChange={(e) => atualizarRegra("conjuntosPorEmendaCalha", e.target.value)} />
                </label>
                <label className="campo">Perda de eletrocalha (%)
                  <input type="number" step="1" value={regras.perdaCalhaPercent} onChange={(e) => atualizarRegra("perdaCalhaPercent", e.target.value)} />
                </label>

                <p style={{ gridColumn: "1 / -1", fontSize: 12, fontWeight: 600, margin: "10px 0 -2px", color: "var(--ink)" }}>Leito para cabos</p>
                <label className="campo">Barra de leito (m)
                  <input type="number" step="0.1" value={regras.barraLeitoM} onChange={(e) => atualizarRegra("barraLeitoM", e.target.value)} />
                </label>
                <label className="campo">Espaçamento entre suportes (m)
                  <input type="number" step="0.1" value={regras.espacamentoSuporteLeitoM} onChange={(e) => atualizarRegra("espacamentoSuporteLeitoM", e.target.value)} />
                </label>
                <label className="campo">Emendas por junção
                  <input type="number" step="1" value={regras.emendasPorJuncaoLeito} onChange={(e) => atualizarRegra("emendasPorJuncaoLeito", e.target.value)} />
                </label>
                <label className="campo">Conjuntos (parafuso+porca+arruela) por emenda
                  <input type="number" step="1" value={regras.parafusosPorEmendaLeito} onChange={(e) => atualizarRegra("parafusosPorEmendaLeito", e.target.value)} />
                </label>
                <label className="campo">Perda de leito (%)
                  <input type="number" step="1" value={regras.perdaLeitoPercent} onChange={(e) => atualizarRegra("perdaLeitoPercent", e.target.value)} />
                </label>

                <p style={{ gridColumn: "1 / -1", fontSize: 12, fontWeight: 600, margin: "10px 0 -2px", color: "var(--ink)" }}>Perfilado</p>
                <label className="campo">Barra de perfilado (m)
                  <input type="number" step="0.1" value={regras.barraPerfiladoM} onChange={(e) => atualizarRegra("barraPerfiladoM", e.target.value)} />
                </label>
                <label className="campo">Espaçamento entre suportes (m)
                  <input type="number" step="0.1" value={regras.espacamentoSuportePerfiladoM} onChange={(e) => atualizarRegra("espacamentoSuportePerfiladoM", e.target.value)} />
                </label>
                <label className="campo">Conjuntos (parafuso+porca+arruela) por emenda
                  <input type="number" step="1" value={regras.conjuntosPorEmendaPerfilado} onChange={(e) => atualizarRegra("conjuntosPorEmendaPerfilado", e.target.value)} />
                </label>
                <label className="campo">Perda de perfilado (%)
                  <input type="number" step="1" value={regras.perdaPerfiladoPercent} onChange={(e) => atualizarRegra("perdaPerfiladoPercent", e.target.value)} />
                </label>

                <p style={{ gridColumn: "1 / -1", fontSize: 12, fontWeight: 600, margin: "10px 0 -2px", color: "var(--ink)" }}>Sustentação por barra roscada (estirante)</p>
                <label className="campo">Porcas por barra roscada
                  <input type="number" step="1" value={regras.porcasPorBarraRoscada} onChange={(e) => atualizarRegra("porcasPorBarraRoscada", e.target.value)} />
                </label>
                <label className="campo">Arruelas por barra roscada
                  <input type="number" step="1" value={regras.arruelasPorBarraRoscada} onChange={(e) => atualizarRegra("arruelasPorBarraRoscada", e.target.value)} />
                </label>

                <p style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--ink-soft)", margin: "4px 0 0" }}>
                  Ajustes valem para os próximos cálculos e recalculam automaticamente os trechos já lançados.
                </p>
              </div>
            )}

            {/* Circuito elétrico */}
            <details className="modulo" open style={{ marginBottom: 16 }}>
              <summary>
              <div style={{ borderLeft: "4px solid var(--yellow)", paddingLeft: 10, marginBottom: 10 }}>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, margin: 0 }}>Circuito elétrico (cabos)</h2>
                <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "2px 0 0" }}>
                  Distância linear até o ponto → metragem de fase, neutro e terra. Iluminação: fase vermelha · neutro azul · terra verde. Tomadas/força: fase preta · neutro azul · terra verde.
                </p>
              </div>
              </summary>

              {trechosCircuito.map((t) => {
                const tipoObj = TIPOS_CIRCUITO.find((x) => x.value === t.tipo);
                const finalidadeObj = FINALIDADES_CIRCUITO.find((x) => x.value === t.finalidade) || FINALIDADES_CIRCUITO[0];
                return (
                  <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--rule)", fontSize: 14, background: editandoCircuitoId === t.id ? "rgba(29,78,102,0.06)" : "transparent" }}>
                    <div>
                      <strong>{t.nome}</strong>
                      <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                        {t.distancia} m · {tipoObj.label} · {t.bitola} mm² · {finalidadeObj.label}
                        {Number(t.cabosPorFase) > 1 && ` · ${t.cabosPorFase}x cabos por fase/neutro`}
                      </div>
                    </div>
                    <button className="no-print" onClick={() => editarTrechoCircuito(t)} title="Editar" aria-label="Editar" style={{ background: "transparent", border: "none", color: "var(--ink-soft)", padding: 4, display: "flex" }}>
                      <Pencil size={15} />
                    </button>
                    <button className="no-print" onClick={() => removerTrechoCircuito(t.id)} title="Remover circuito" aria-label="Remover circuito" style={{ background: "transparent", border: "none", color: "var(--ink-soft)", padding: 4, display: "flex" }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}

              {editandoCircuitoId && (
                <p style={{ fontSize: 12, color: "var(--blue)", margin: "10px 0 0" }}>Editando circuito — ajuste os campos abaixo e clique em Salvar.</p>
              )}
              <div className="no-print" style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <label className="campo" style={{ flex: "2 1 150px" }}>Nome do circuito
                  <input type="text" placeholder="ex: Tomadas cozinha" value={formCircuito.nome || ""} onChange={(e) => setFormCircuito((p) => ({ ...p, nome: e.target.value }))} />
                </label>
                <label className="campo" style={{ width: 95 }}>Distância (m)
                  <input type="number" step="0.1" min="0" value={formCircuito.distancia || ""} onChange={(e) => setFormCircuito((p) => ({ ...p, distancia: e.target.value }))} />
                </label>
                <label className="campo" style={{ width: 190 }}>Tipo
                  <select value={formCircuito.tipo} onChange={(e) => setFormCircuito((p) => ({ ...p, tipo: e.target.value }))}>
                    {TIPOS_CIRCUITO.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                  </select>
                </label>
                <label className="campo" style={{ width: 150 }}>Finalidade
                  <select value={formCircuito.finalidade} onChange={(e) => setFormCircuito((p) => ({ ...p, finalidade: e.target.value }))}>
                    {FINALIDADES_CIRCUITO.map((f) => (<option key={f.value} value={f.value}>{f.label}</option>))}
                  </select>
                </label>
                <label className="campo" style={{ width: 100 }}>Bitola (mm²)
                  <SeletorBitola value={formCircuito.bitola} onChange={(v) => setFormCircuito((p) => ({ ...p, bitola: v }))} opcoes={BITOLAS_CABO} placeholder="ex: 2,5" />
                </label>
                <label className="campo" style={{ width: 130 }}>Cabos por fase/neutro
                  <input type="number" step="1" min="1" placeholder="1" value={formCircuito.cabosPorFase || ""} onChange={(e) => setFormCircuito((p) => ({ ...p, cabosPorFase: e.target.value }))} />
                </label>
                <button onClick={adicionarTrechoCircuito} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--blue)", color: "white", border: "none", borderRadius: 3, padding: "8px 12px", fontSize: 13, fontWeight: 500, height: 34 }}>
                  {editandoCircuitoId ? <><Check size={14} /> Salvar</> : <><Plus size={14} /> Calcular</>}
                </button>
                {editandoCircuitoId && (
                  <button onClick={cancelarEdicaoCircuito} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", color: "var(--ink-soft)", border: "1px solid var(--rule)", borderRadius: 3, padding: "8px 12px", fontSize: 13, height: 34 }}>
                    Cancelar
                  </button>
                )}
              </div>
            </details>

            {/* Cabos multipolares: PP e Shield */}
            <details className="modulo" style={{ marginBottom: 16 }}>
              <summary>
              <div style={{ borderLeft: "4px solid var(--yellow)", paddingLeft: 10, marginBottom: 10 }}>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, margin: 0 }}>Cabos com proteção (PP e Shield)</h2>
                <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "2px 0 0" }}>
                  Cabo PP multipolar (2 a 5 vias) e cabo blindado Shield para alarme de incêndio. A metragem usa a mesma folga e perda dos cabos.
                </p>
              </div>
              </summary>
              {trechosMultipolar.map((t) => {
                const tipoObj = TIPOS_MULTIPOLAR.find((x) => x.value === t.tipo) || TIPOS_MULTIPOLAR[0];
                return (
                  <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--rule)", fontSize: 14, background: editandoMultipolarId === t.id ? "rgba(29,78,102,0.06)" : "transparent" }}>
                    <div>
                      <strong>{t.nome}</strong>
                      <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                        {t.distancia} m · {tipoObj.label} · {t.vias}x{t.bitola} mm²{Number(t.quantidade) > 1 && ` · ${t.quantidade} cabos`}
                      </div>
                    </div>
                    <button className="no-print" onClick={() => { setEditandoMultipolarId(t.id); setFormMultipolar({ nome: t.nome, distancia: String(t.distancia), quantidade: String(t.quantidade || 1), tipo: t.tipo, vias: t.vias, bitola: t.bitola }); }} title="Editar" aria-label={`Editar ${t.nome}`} style={{ background: "transparent", border: "none", color: "var(--ink-soft)", padding: 4, display: "flex" }}>
                      <Pencil size={15} />
                    </button>
                    <button className="no-print" onClick={() => setTrechosMultipolar((prev) => prev.filter((x) => x.id !== t.id))} title="Remover" aria-label={`Remover ${t.nome}`} style={{ background: "transparent", border: "none", color: "var(--ink-soft)", padding: 4, display: "flex" }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
              {editandoMultipolarId && (
                <p style={{ fontSize: 12, color: "var(--blue)", margin: "10px 0 0" }}>Editando trecho — ajuste os campos abaixo e clique em Salvar.</p>
              )}
              <div className="no-print" style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <label className="campo" style={{ flex: "2 1 150px" }}>Nome do trecho
                  <input type="text" placeholder="ex: Motor bomba / Laço alarme" value={formMultipolar.nome || ""} onChange={(e) => setFormMultipolar((p) => ({ ...p, nome: e.target.value }))} />
                </label>
                <label className="campo" style={{ width: 95 }}>Distância (m)
                  <input type="number" step="0.1" min="0" value={formMultipolar.distancia || ""} onChange={(e) => setFormMultipolar((p) => ({ ...p, distancia: e.target.value }))} />
                </label>
                <label className="campo" style={{ width: 230 }}>Tipo de cabo
                  <select value={formMultipolar.tipo} onChange={(e) => trocarTipoMultipolar(e.target.value)}>
                    {TIPOS_MULTIPOLAR.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                  </select>
                </label>
                <label className="campo" style={{ width: 80 }}>Vias
                  <select value={formMultipolar.vias} onChange={(e) => setFormMultipolar((p) => ({ ...p, vias: e.target.value }))}>
                    {TIPOS_MULTIPOLAR.find((x) => x.value === formMultipolar.tipo).vias.map((v) => (<option key={v} value={v}>{v} vias</option>))}
                  </select>
                </label>
                <label className="campo" style={{ width: 100 }}>Bitola (mm²)
                  <select value={formMultipolar.bitola} onChange={(e) => setFormMultipolar((p) => ({ ...p, bitola: e.target.value }))}>
                    {TIPOS_MULTIPOLAR.find((x) => x.value === formMultipolar.tipo).bitolas.map((b) => (<option key={b} value={b}>{b}</option>))}
                  </select>
                </label>
                <label className="campo" style={{ width: 110 }}>Qtd. de cabos
                  <input type="number" step="1" min="1" placeholder="1" value={formMultipolar.quantidade || ""} onChange={(e) => setFormMultipolar((p) => ({ ...p, quantidade: e.target.value }))} />
                </label>
                <button onClick={salvarMultipolar} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--blue)", color: "white", border: "none", borderRadius: 3, padding: "8px 12px", fontSize: 13, fontWeight: 500, height: 34 }}>
                  {editandoMultipolarId ? <><Check size={14} /> Salvar</> : <><Plus size={14} /> Calcular</>}
                </button>
                {editandoMultipolarId && (
                  <button onClick={() => { setEditandoMultipolarId(null); setFormMultipolar({ tipo: "pp", vias: "3", bitola: "1,5", quantidade: "1" }); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", color: "var(--ink-soft)", border: "1px solid var(--rule)", borderRadius: 3, padding: "8px 12px", fontSize: 13, height: 34 }}>
                    Cancelar
                  </button>
                )}
              </div>
            </details>

            {/* Terminais olhal de compressão */}
            <details className="modulo" style={{ marginBottom: 16 }}>
              <summary>
              <div style={{ borderLeft: "4px solid var(--yellow)", paddingLeft: 10, marginBottom: 10 }}>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, margin: 0 }}>Terminais olhal de compressão</h2>
                <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "2px 0 0" }}>
                  Mesma lógica dos cabos (tipo de circuito + cabos por fase), mas conta os terminais nas duas pontas de cada condutor. Ex: 2x trifásico 185mm → 9 condutores × 2 pontas = 18 terminais.
                </p>
              </div>
              </summary>

              {trechosTerminal.map((t) => {
                const tipoObj = TIPOS_CIRCUITO.find((x) => x.value === t.tipo);
                return (
                  <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--rule)", fontSize: 14, background: editandoTerminalId === t.id ? "rgba(29,78,102,0.06)" : "transparent" }}>
                    <div>
                      <strong>{t.nome}</strong>
                      <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                        {tipoObj?.label} · {t.bitola}
                        {Number(t.cabosPorFase) > 1 && ` · ${t.cabosPorFase}x cabos por fase/neutro`}
                      </div>
                    </div>
                    <button className="no-print" onClick={() => editarTrechoTerminal(t)} title="Editar" aria-label="Editar" style={{ background: "transparent", border: "none", color: "var(--ink-soft)", padding: 4, display: "flex" }}>
                      <Pencil size={15} />
                    </button>
                    <button className="no-print" onClick={() => removerTrechoTerminal(t.id)} title="Remover" aria-label="Remover" style={{ background: "transparent", border: "none", color: "var(--ink-soft)", padding: 4, display: "flex" }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}

              {editandoTerminalId && (
                <p style={{ fontSize: 12, color: "var(--blue)", margin: "10px 0 0" }}>Editando terminais — ajuste os campos abaixo e clique em Salvar.</p>
              )}
              <div className="no-print" style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <label className="campo" style={{ flex: "1 1 130px" }}>Nome/ambiente
                  <input type="text" placeholder="ex: Alimentador QGBT" value={formTerminal.nome || ""} onChange={(e) => setFormTerminal((p) => ({ ...p, nome: e.target.value }))} />
                </label>
                <label className="campo" style={{ width: 190 }}>Tipo
                  <select value={formTerminal.tipo} onChange={(e) => setFormTerminal((p) => ({ ...p, tipo: e.target.value }))}>
                    {TIPOS_CIRCUITO.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                  </select>
                </label>
                <label className="campo" style={{ width: 130 }}>Cabos por fase/neutro
                  <input type="number" step="1" min="1" placeholder="1" value={formTerminal.cabosPorFase || ""} onChange={(e) => setFormTerminal((p) => ({ ...p, cabosPorFase: e.target.value }))} />
                </label>
                <label className="campo" style={{ width: 130 }}>Bitola
                  <SeletorBitola value={formTerminal.bitola} onChange={(v) => setFormTerminal((p) => ({ ...p, bitola: v }))} opcoes={BITOLAS_TERMINAL} placeholder="ex: 10mm" />
                </label>
                <button onClick={adicionarTrechoTerminal} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--blue)", color: "white", border: "none", borderRadius: 3, padding: "8px 12px", fontSize: 13, fontWeight: 500, height: 34 }}>
                  {editandoTerminalId ? <><Check size={14} /> Salvar</> : <><Plus size={14} /> Calcular</>}
                </button>
                {editandoTerminalId && (
                  <button onClick={cancelarEdicaoTerminal} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", color: "var(--ink-soft)", border: "1px solid var(--rule)", borderRadius: 3, padding: "8px 12px", fontSize: 13, height: 34 }}>
                    Cancelar
                  </button>
                )}
              </div>
            </details>

            {/* Infraestrutura */}
            <details className="modulo" style={{ marginBottom: 16 }}>
              <summary>
              <div style={{ borderLeft: "4px solid var(--blue)", paddingLeft: 10, marginBottom: 10 }}>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, margin: 0 }}>Infraestrutura</h2>
                <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "2px 0 0" }}>Eletroduto, eletrocalha perfurada ou perfilado — distância linear → peças, emendas, suportes, parafusos, porcas, buchas e arruelas.</p>
              </div>
              </summary>

              {trechosInfra.map((t) => {
                const tipoInfo = TIPOS_INFRA.find((x) => x.value === t.tipo) || TIPOS_INFRA[0];
                const roscadaInfo = OPCOES_BARRA_ROSCADA.find((x) => x.value === t.barraRoscada);
                return (
                  <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--rule)", fontSize: 14, background: editandoInfraId === t.id ? "rgba(29,78,102,0.06)" : "transparent" }}>
                    <div>
                      <strong>{t.nome}</strong>
                      <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                        {t.distancia} m · {tipoInfo.label} {t.dimensao}
                        {t.barraRoscada && t.barraRoscada !== "nao" && ` · sustentação ${roscadaInfo?.label.toLowerCase()}`}
                      </div>
                    </div>
                    <button className="no-print" onClick={() => editarTrechoInfra(t)} title="Editar" aria-label="Editar" style={{ background: "transparent", border: "none", color: "var(--ink-soft)", padding: 4, display: "flex" }}>
                      <Pencil size={15} />
                    </button>
                    <button className="no-print" onClick={() => removerTrechoInfra(t.id)} title="Remover trecho" aria-label="Remover trecho" style={{ background: "transparent", border: "none", color: "var(--ink-soft)", padding: 4, display: "flex" }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}

              {editandoInfraId && (
                <p style={{ fontSize: 12, color: "var(--blue)", margin: "10px 0 0" }}>Editando trecho — ajuste os campos abaixo e clique em Salvar.</p>
              )}
              <div className="no-print" style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <label className="campo" style={{ width: 170 }}>Tipo de infraestrutura
                  <select
                    value={formInfra.tipo}
                    onChange={(e) => {
                      const tipo = e.target.value;
                      const tipoInfo = TIPOS_INFRA.find((x) => x.value === tipo);
                      setFormInfra((p) => ({ ...p, tipo, dimensao: p.dimensao || tipoInfo.opcoesDimensao[0] }));
                    }}
                  >
                    {TIPOS_INFRA.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                  </select>
                </label>
                <label className="campo" style={{ flex: "2 1 150px" }}>Nome do trecho
                  <input type="text" placeholder="ex: Alimentador quadro 2" value={formInfra.nome || ""} onChange={(e) => setFormInfra((p) => ({ ...p, nome: e.target.value }))} />
                </label>
                <label className="campo" style={{ width: 100 }}>Distância (m)
                  <input type="number" step="0.1" min="0" value={formInfra.distancia || ""} onChange={(e) => setFormInfra((p) => ({ ...p, distancia: e.target.value }))} />
                </label>
                <label className="campo" style={{ width: 150 }}>{TIPOS_INFRA.find((x) => x.value === formInfra.tipo)?.labelDimensao || "Dimensão"}
                  <SeletorBitola
                    value={formInfra.dimensao}
                    onChange={(v) => setFormInfra((p) => ({ ...p, dimensao: v }))}
                    opcoes={TIPOS_INFRA.find((x) => x.value === formInfra.tipo)?.opcoesDimensao || []}
                    placeholder="digite a dimensão"
                  />
                </label>
                {formInfra.tipo !== "eletroduto" && (
                  <label className="campo" style={{ width: 210 }}>Sustentação por barra roscada?
                    <select value={formInfra.barraRoscada || "nao"} onChange={(e) => setFormInfra((p) => ({ ...p, barraRoscada: e.target.value }))}>
                      {OPCOES_BARRA_ROSCADA.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                    </select>
                  </label>
                )}
                <button onClick={adicionarTrechoInfra} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--blue)", color: "white", border: "none", borderRadius: 3, padding: "8px 12px", fontSize: 13, fontWeight: 500, height: 34 }}>
                  {editandoInfraId ? <><Check size={14} /> Salvar</> : <><Plus size={14} /> Calcular</>}
                </button>
                {editandoInfraId && (
                  <button onClick={cancelarEdicaoInfra} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", color: "var(--ink-soft)", border: "1px solid var(--rule)", borderRadius: 3, padding: "8px 12px", fontSize: 13, height: 34 }}>
                    Cancelar
                  </button>
                )}
              </div>
            </details>

            {/* Tomadas */}
            <details className="modulo" style={{ marginBottom: 16 }}>
              <summary>
              <div style={{ borderLeft: "4px solid var(--green)", paddingLeft: 10, marginBottom: 10 }}>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, margin: 0 }}>Tomadas</h2>
                <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "2px 0 0" }}>
                  Condulete e Aquatic seguem o padrão 2P+T. Industrial sobrepor monofásico usa 2P+T 16A 6H Azul.
                </p>
              </div>
              </summary>

              {trechosTomada.map((t) => (
                <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--rule)", fontSize: 14, background: editandoTomadaId === t.id ? "rgba(29,78,102,0.06)" : "transparent" }}>
                  <div>
                    <strong>{t.nome}</strong>
                    <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                      {t.quantidade} un · {TIPOS_TOMADA.find((x) => x.value === t.tipo)?.label}
                      {t.tipo === "condulete" && ` · ${t.amperagem} · ${t.cor} · caixa ${t.bitola}`}
                      {t.tipo === "aquatic" && ` · ${t.amperagem}`}
                      {t.tipo === "pial" && ` · ${t.amperagem} · caixa 4x2`}
                      {t.tipo === "industrial" && t.fase === "mono" && " · monofásico"}
                      {t.tipo === "industrial" && t.fase === "tri" && ` · trifásico ${PADROES_TRIFASICO_INDUSTRIAL.find((p) => p.value === t.padraoTrifasico)?.label || ""}`}
                    </div>
                  </div>
                  <button className="no-print" onClick={() => editarTrechoTomada(t)} title="Editar" aria-label="Editar" style={{ background: "transparent", border: "none", color: "var(--ink-soft)", padding: 4, display: "flex" }}>
                    <Pencil size={15} />
                  </button>
                  <button className="no-print" onClick={() => removerTrechoTomada(t.id)} title="Remover" aria-label="Remover" style={{ background: "transparent", border: "none", color: "var(--ink-soft)", padding: 4, display: "flex" }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {editandoTomadaId && (
                <p style={{ fontSize: 12, color: "var(--blue)", margin: "10px 0 0" }}>Editando tomadas — ajuste os campos abaixo e clique em Salvar.</p>
              )}

              <div className="no-print" style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <label className="campo" style={{ width: 170 }}>Tipo de tomada
                  <select value={formTomada.tipo} onChange={(e) => setFormTomada((p) => ({ ...p, tipo: e.target.value }))}>
                    {TIPOS_TOMADA.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                  </select>
                </label>
                <label className="campo" style={{ flex: "1 1 130px" }}>Nome/ambiente
                  <input type="text" placeholder="ex: Tomadas sala" value={formTomada.nome || ""} onChange={(e) => setFormTomada((p) => ({ ...p, nome: e.target.value }))} />
                </label>
                <label className="campo" style={{ width: 90 }}>Quantidade
                  <input type="number" step="1" min="0" value={formTomada.quantidade || ""} onChange={(e) => setFormTomada((p) => ({ ...p, quantidade: e.target.value }))} />
                </label>

                {formTomada.tipo === "condulete" && (
                  <>
                    <label className="campo" style={{ width: 90 }}>Amperagem
                      <select value={formTomada.amperagem} onChange={(e) => setFormTomada((p) => ({ ...p, amperagem: e.target.value }))}>
                        {AMPERAGENS_TOMADA.map((a) => (<option key={a} value={a}>{a}</option>))}
                      </select>
                    </label>
                    <label className="campo" style={{ width: 100 }}>Cor
                      <select value={formTomada.cor} onChange={(e) => setFormTomada((p) => ({ ...p, cor: e.target.value }))}>
                        {CORES_CONDULETE.map((c) => (<option key={c} value={c}>{c}</option>))}
                      </select>
                    </label>
                    <label className="campo" style={{ width: 130 }}>Bitola da caixa
                      <SeletorBitola value={formTomada.bitola} onChange={(v) => setFormTomada((p) => ({ ...p, bitola: v }))} opcoes={TIPOS_INFRA.find((x) => x.value === "eletroduto").opcoesDimensao} placeholder='ex: 3/4"' />
                    </label>
                  </>
                )}

                {formTomada.tipo === "aquatic" && (
                  <label className="campo" style={{ width: 90 }}>Amperagem
                    <select value={formTomada.amperagem} onChange={(e) => setFormTomada((p) => ({ ...p, amperagem: e.target.value }))}>
                      {AMPERAGENS_TOMADA.map((a) => (<option key={a} value={a}>{a}</option>))}
                    </select>
                  </label>
                )}

                {formTomada.tipo === "pial" && (
                  <label className="campo" style={{ width: 90 }}>Amperagem
                    <select value={formTomada.amperagem} onChange={(e) => setFormTomada((p) => ({ ...p, amperagem: e.target.value }))}>
                      {AMPERAGENS_TOMADA.map((a) => (<option key={a} value={a}>{a}</option>))}
                    </select>
                  </label>
                )}

                {formTomada.tipo === "industrial" && (
                  <>
                    <label className="campo" style={{ width: 130 }}>Fase
                      <select value={formTomada.fase} onChange={(e) => setFormTomada((p) => ({ ...p, fase: e.target.value }))}>
                        {FASES_INDUSTRIAL.map((f) => (<option key={f.value} value={f.value}>{f.label}</option>))}
                      </select>
                    </label>
                    {formTomada.fase === "tri" && (
                      <label className="campo" style={{ width: 220 }}>Padrão
                        <select value={formTomada.padraoTrifasico || ""} onChange={(e) => setFormTomada((p) => ({ ...p, padraoTrifasico: e.target.value }))}>
                          <option value="">Selecione</option>
                          {PADROES_TRIFASICO_INDUSTRIAL.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
                        </select>
                      </label>
                    )}
                  </>
                )}

                <button onClick={adicionarTrechoTomada} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--blue)", color: "white", border: "none", borderRadius: 3, padding: "8px 12px", fontSize: 13, fontWeight: 500, height: 34 }}>
                  {editandoTomadaId ? <><Check size={14} /> Salvar</> : <><Plus size={14} /> Calcular</>}
                </button>
                {editandoTomadaId && (
                  <button onClick={cancelarEdicaoTomada} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", color: "var(--ink-soft)", border: "1px solid var(--rule)", borderRadius: 3, padding: "8px 12px", fontSize: 13, height: 34 }}>
                    Cancelar
                  </button>
                )}
              </div>
            </details>
          </div>
        )}

        {visao === "imprimir" && (() => {
          const filtra = (arr) => (soPendentes ? arr.filter((i) => !i.adquirido) : arr);
          const gruposDe = (itens, prefixo) => {
            const cats = Array.from(new Set([...CATEGORIAS_PADRAO, ...itens.map((i) => i.categoria)]));
            const base = tipoImpressao === "geral"
              ? agruparGeral(itens).map((g) => ({ titulo: g.grupo, itens: filtra(g.itens) }))
              : cats.map((c) => ({ titulo: c, itens: filtra(itens.filter((i) => i.categoria === c)) }));
            return base.map((g) => ({ ...g, titulo: prefixo ? `${prefixo} · ${g.titulo}` : g.titulo }));
          };
          let grupos;
          if (escopoImpressao === "obra") {
            const atualId = obraAtual();
            const setores = listarSetores(atualId);
            grupos = setores.flatMap((st) => gruposDe(st.id === atualId ? itensCombinados : itensDoSetor(st.id), st.setor || "Principal"));
          } else {
            grupos = tipoImpressao === "geral"
              ? listaGeralAgrupada.map((g) => ({ titulo: g.grupo, itens: filtra(g.itens) }))
              : categorias.map((c) => ({ titulo: c, itens: filtra(itensCombinados.filter((i) => i.categoria === c)) }));
          }
          const visiveis = grupos.filter((g) => g.itens.length > 0);
          const subtitulo = `${escopoImpressao === "obra" ? "Obra completa — " : ""}${tipoImpressao === "geral" ? "Lista geral" : "Lista por categoria"}`;
          const opt = (ativo) => ({ background: ativo ? "var(--ink)" : "transparent", color: ativo ? "#F5F5F2" : "var(--ink)", border: "1px solid var(--ink)", borderRadius: 3, padding: "7px 12px", fontSize: 13 });
          return (
            <div>
              <div className="no-print" style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 20 }}>
                <button aria-pressed={escopoImpressao === "setor"} style={opt(escopoImpressao === "setor")} onClick={() => setEscopoImpressao("setor")}>Setor atual</button>
                <button aria-pressed={escopoImpressao === "obra"} style={opt(escopoImpressao === "obra")} onClick={() => setEscopoImpressao("obra")}>Obra completa</button>
                <span style={{ width: 1, height: 22, background: "var(--rule)" }} />
                <button aria-pressed={tipoImpressao === "categorias"} style={opt(tipoImpressao === "categorias")} onClick={() => setTipoImpressao("categorias")}>Por categoria</button>
                <button aria-pressed={tipoImpressao === "geral"} style={opt(tipoImpressao === "geral")} onClick={() => setTipoImpressao("geral")}>Lista geral</button>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginLeft: 6 }}>
                  <input type="checkbox" checked={soPendentes} onChange={(e) => setSoPendentes(e.target.checked)} /> Só o que falta comprar
                </label>
                <button onClick={() => {
                  const linhas = ["*Eletron Watts Construções*", `*${obra || "Levantamento de material elétrico"}*`, `${subtitulo}${soPendentes ? " — falta comprar" : ""}`, ""];
                  for (const g of visiveis) {
                    linhas.push(`*${g.titulo}*`);
                    for (const i of g.itens) linhas.push(`${i.adquirido ? "✅" : "⬜"} ${i.nome} — ${String(i.quantidade).replace(".", ",")} ${i.unidade}`);
                    linhas.push("");
                  }
                  if (!visiveis.length) linhas.push("Nenhum item.");
                  window.open(`https://wa.me/?text=${encodeURIComponent(linhas.join("\n"))}`, "_blank");
                }} style={{ marginLeft: "auto", background: "#25D366", color: "#0B2A17", border: "none", borderRadius: 3, padding: "9px 14px", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <Send size={16} /> Enviar no WhatsApp
                </button>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>Perda
                  <select value={perda} onChange={(e) => setPerda(Number(e.target.value))} aria-label="Margem de perda">
                    {OPCOES_PERDA.map((p) => <option key={p} value={p}>{p === 0 ? "Nenhum (0%)" : `${p}%`}</option>)}
                  </select>
                </label>
                <button onClick={() => gerarPDF({ obra, subtitulo, grupos: visiveis, perda })} style={{ background: "var(--yellow)", color: "var(--ink)", border: "none", borderRadius: 3, padding: "9px 14px", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <Printer size={16} /> Baixar PDF
                </button>
                <button onClick={() => gerarExcel({ obra, subtitulo, grupos: visiveis, perda })} style={{ background: "#1D6F42", color: "#F5F5F2", border: "none", borderRadius: 3, padding: "9px 14px", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <Download size={16} /> Baixar Excel
                </button>
              </div>
              <div style={{ background: "white", border: "1px solid #ddd", padding: 20 }}>
                <h2 style={{ margin: "0 0 2px", fontSize: 18 }}>{obra || "Levantamento de material elétrico"}</h2>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 14 }}>
                  {subtitulo}{soPendentes ? " — pendentes" : ""} · {new Date().toLocaleDateString("pt-BR")}
                </div>
                {visiveis.length === 0 && <div style={{ fontSize: 13, color: "#666" }}>Nenhum item para imprimir.</div>}
                {visiveis.map((g) => (
                  <div key={g.titulo} style={{ marginBottom: 16, breakInside: "avoid" }}>
                    <div style={{ fontWeight: 600, fontSize: 14, borderBottom: "1px solid #333", paddingBottom: 3, marginBottom: 4 }}>{g.titulo}</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <tbody>
                        {g.itens.map((i, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={{ padding: "4px 0", width: 22 }}>{i.adquirido ? "☑" : "☐"}</td>
                            <td style={{ padding: "4px 0" }}>{i.nome}</td>
                            <td style={{ padding: "4px 0", textAlign: "right", whiteSpace: "nowrap" }}>{String(qtdCompra(i, perda)).replace(".", ",")} {i.unidade}{perda > 0 && i.unidade === "m" ? ` (${String(i.quantidade).replace(".", ",")} + ${perda}%)` : ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {visao === "geral" && (
          <section>
            {listaGeralAgrupada.map((g) => {
              const totalAdquiridosGrupo = g.itens.filter((i) => i.adquirido).length;
              return (
                <div key={g.grupo} style={{ marginBottom: 22 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderLeft: "4px solid var(--yellow)", paddingLeft: 10, marginBottom: 8 }}>
                    <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, margin: 0 }}>{g.grupo}</h2>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "var(--ink-soft)" }}>
                      {totalAdquiridosGrupo}/{g.itens.length}
                    </span>
                  </div>
                  <div style={{ borderTop: "1px solid var(--rule)" }}>
                    {g.itens.map((item, idx) => (
                      <div key={idx} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--rule)", fontSize: 14, opacity: item.adquirido ? 0.55 : 1 }}>
                        <span style={{ width: 20, height: 20, borderRadius: 4, border: `1px solid ${item.adquirido ? "var(--green)" : "var(--rule)"}`, background: item.adquirido ? "var(--green)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                          {item.adquirido && <Check size={12} />}
                        </span>
                        <span style={{ textDecoration: item.adquirido ? "line-through" : "none" }}>{item.nome}</span>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, minWidth: 80, textAlign: "right" }}>{item.quantidade} {item.unidade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {listaGeralAgrupada.length === 0 && <p style={{ color: "var(--ink-soft)", fontSize: 13, padding: "10px 0" }}>Ainda não há itens lançados.</p>}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "2px solid var(--ink)", display: "flex", justifyContent: "space-between", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "var(--ink-soft)" }}>
              <span>{listaGeralAgrupada.reduce((s, g) => s + g.itens.length, 0)} materiais distintos em {listaGeralAgrupada.length} grupos</span>
              <span>{totalAdquiridos}/{totalItens} lançamentos adquiridos</span>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function SeletorBitola({ value, onChange, opcoes, placeholder }) {
  const emOutro = !value || !opcoes.includes(value);
  return (
    <>
      <select
        value={emOutro ? OUTRO : value}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === OUTRO ? "" : v);
        }}
      >
        {opcoes.map((o) => (<option key={o} value={o}>{o}</option>))}
        <option value={OUTRO}>Outra (digitar)</option>
      </select>
      {emOutro && (
        <input
          type="text"
          placeholder={placeholder || "digite o valor"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          style={{ marginTop: 4 }}
        />
      )}
    </>
  );
}

function NovaCategoria({ onAdd, categorias }) {
  const [nome, setNome] = useState("");
  const [aberto, setAberto] = useState(false);

  function confirmar() {
    const limpo = nome.trim();
    if (!limpo || categorias.includes(limpo)) return;
    onAdd(limpo);
    setNome("");
    setAberto(false);
  }

  if (!aberto) {
    return (
      <button className="no-print" onClick={() => setAberto(true)} style={{ background: "transparent", border: "1px dashed var(--rule)", borderRadius: 3, padding: "8px 12px", fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>
        + Nova categoria
      </button>
    );
  }

  return (
    <div className="no-print" style={{ display: "flex", gap: 8, marginTop: 4 }}>
      <input autoFocus type="text" placeholder="Nome da categoria" value={nome} onChange={(e) => setNome(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmar()} style={{ flex: 1, maxWidth: 220 }} />
      <button onClick={confirmar} style={{ background: "var(--ink)", color: "white", border: "none", borderRadius: 3, padding: "8px 12px", fontSize: 13 }}>Criar</button>
    </div>
  );
}
