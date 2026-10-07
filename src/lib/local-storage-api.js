// Armazenamento local com suporte a várias obras.
// A obra "padrao" usa as chaves originais (mantém dados antigos); as demais usam prefixo.
const LISTA = "obras:lista";
const ATUAL = "obras:atual";

import { marcar } from "./nuvem-sync";
const put = (k, v) => { window.localStorage.setItem(k, v); marcar(k, v); };
const del = (k) => { window.localStorage.removeItem(k); marcar(k, null); };
const ls = () => (typeof window === "undefined" ? null : window.localStorage);

function chaveReal(id, key) {
  return id === "padrao" ? key : `obra:${id}:${key}`;
}

export function listarObras() {
  const s = ls();
  if (!s) return [];
  let lista = [];
  try { lista = JSON.parse(s.getItem(LISTA) || "[]"); } catch { lista = []; }
  if (!lista.length) {
    lista = [{ id: "padrao" }];
    put(LISTA, JSON.stringify(lista));
  }
  return lista.map((o) => {
    let nome = "";
    try { nome = JSON.parse(s.getItem(chaveReal(o.id, "levantamento:meta")) || "{}").obra || ""; } catch {}
    return { id: o.id, nome: nome || "Obra sem nome", pai: o.pai || null, setor: o.setor || "" };
  });
}

export function obraAtual() {
  const s = ls();
  const lista = listarObras();
  const id = s?.getItem(ATUAL);
  return lista.some((o) => o.id === id) ? id : lista[0]?.id || "padrao";
}

export function selecionarObra(id) {
  ls()?.setItem(ATUAL, id);
}

function lerLista() {
  try { return JSON.parse(ls().getItem(LISTA) || "[]"); } catch { return []; }
}
function salvarLista(ids) {
  const antigos = Object.fromEntries(lerLista().map((o) => [o.id, o]));
  put(LISTA, JSON.stringify(ids.map((x) => (typeof x === "string" ? (antigos[x] || { id: x }) : x))));
}

// Setores: sub-listas de uma obra. Cada setor guarda seus próprios itens.
export function listarSetores(obraId) {
  const lista = listarObras();
  const pai = lista.find((o) => o.id === obraId)?.pai || obraId;
  return lista.filter((o) => o.id === pai || o.pai === pai);
}

export function criarSetor(obraId, nomeSetor) {
  const lista = listarObras();
  const pai = lista.find((o) => o.id === obraId)?.pai || obraId;
  const nomeObra = lista.find((o) => o.id === pai)?.nome || "";
  const id = Date.now().toString(36);
  salvarLista([...lerLista(), { id, pai, setor: nomeSetor }]);
  put(chaveReal(id, "levantamento:meta"), JSON.stringify({ obra: nomeObra }));
  selecionarObra(id);
  return id;
}

export function renomearSetor(id, nomeSetor) {
  salvarLista(lerLista().map((o) => (o.id === id ? { ...o, setor: nomeSetor } : o)));
}

function chavesDaObra(id) {
  const s = ls();
  const out = [];
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (id === "padrao" ? k.startsWith("levantamento:") : k.startsWith(`obra:${id}:`)) out.push(k);
  }
  return out;
}

export function criarObra(nome = "") {
  const id = Date.now().toString(36);
  salvarLista([...listarObras().map((o) => o.id), id]);
  put(chaveReal(id, "levantamento:meta"), JSON.stringify({ obra: nome }));
  selecionarObra(id);
  return id;
}

export function duplicarObra(origem) {
  const s = ls();
  const id = Date.now().toString(36);
  for (const k of chavesDaObra(origem)) {
    const base = origem === "padrao" ? k : k.slice(`obra:${origem}:`.length);
    put(chaveReal(id, base), s.getItem(k));
  }
  try {
    const meta = JSON.parse(s.getItem(chaveReal(id, "levantamento:meta")) || "{}");
    meta.obra = `${meta.obra || "Obra"} (cópia)`;
    put(chaveReal(id, "levantamento:meta"), JSON.stringify(meta));
  } catch {}
  salvarLista([...listarObras().map((o) => o.id), id]);
  selecionarObra(id);
  return id;
}

export function excluirObra(id) {
  const lista = lerLista();
  const alvo = lista.find((o) => o.id === id);
  const ids = alvo?.pai ? [id] : [id, ...lista.filter((o) => o.pai === id).map((o) => o.id)];
  for (const x of ids) for (const k of chavesDaObra(x)) del(k);
  const resto = lista.filter((o) => !ids.includes(o.id)).map((o) => o.id);
  if (alvo?.pai) { salvarLista(resto); selecionarObra(alvo.pai); return; }
  if (!resto.length) resto.push(Date.now().toString(36));
  salvarLista(resto);
  selecionarObra(resto[0]);
}

export const storage = {
  async get(key) {
    const s = ls();
    if (!s) return null;
    const value = s.getItem(chaveReal(obraAtual(), key));
    return value === null ? null : { value };
  },
  async set(key, value) {
    if (ls()) put(chaveReal(obraAtual(), key), value);
  },
  async delete(key) {
    if (ls()) del(chaveReal(obraAtual(), key));
  },
};
