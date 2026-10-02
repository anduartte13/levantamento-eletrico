// Armazenamento local com suporte a várias obras.
// A obra "padrao" usa as chaves originais (mantém dados antigos); as demais usam prefixo.
const LISTA = "obras:lista";
const ATUAL = "obras:atual";

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
    s.setItem(LISTA, JSON.stringify(lista));
  }
  return lista.map((o) => {
    let nome = "";
    try { nome = JSON.parse(s.getItem(chaveReal(o.id, "levantamento:meta")) || "{}").obra || ""; } catch {}
    return { id: o.id, nome: nome || "Obra sem nome" };
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

function salvarLista(ids) {
  ls()?.setItem(LISTA, JSON.stringify(ids.map((id) => ({ id }))));
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
  ls().setItem(chaveReal(id, "levantamento:meta"), JSON.stringify({ obra: nome }));
  selecionarObra(id);
  return id;
}

export function duplicarObra(origem) {
  const s = ls();
  const id = Date.now().toString(36);
  for (const k of chavesDaObra(origem)) {
    const base = origem === "padrao" ? k : k.slice(`obra:${origem}:`.length);
    s.setItem(chaveReal(id, base), s.getItem(k));
  }
  try {
    const meta = JSON.parse(s.getItem(chaveReal(id, "levantamento:meta")) || "{}");
    meta.obra = `${meta.obra || "Obra"} (cópia)`;
    s.setItem(chaveReal(id, "levantamento:meta"), JSON.stringify(meta));
  } catch {}
  salvarLista([...listarObras().map((o) => o.id), id]);
  selecionarObra(id);
  return id;
}

export function excluirObra(id) {
  const s = ls();
  for (const k of chavesDaObra(id)) s.removeItem(k);
  const resto = listarObras().map((o) => o.id).filter((x) => x !== id);
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
    ls()?.setItem(chaveReal(obraAtual(), key), value);
  },
  async delete(key) {
    ls()?.removeItem(chaveReal(obraAtual(), key));
  },
};
