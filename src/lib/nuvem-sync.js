// Salvamento automático na nuvem: espelha as chaves do app guardadas no aparelho.
import { supabase } from "@/integrations/supabase/client";

const ehChaveApp = (k) => k === "obras:lista" || k.startsWith("levantamento:") || k.startsWith("obra:");

let userId = null;
const pendentes = new Map(); // chave -> valor (null = apagar)
let timer = null;
const ouvintes = new Set();
let estado = "salvo";

function setEstado(e) { estado = e; ouvintes.forEach((f) => f(e)); }
export function ouvirEstado(f) { ouvintes.add(f); f(estado); return () => ouvintes.delete(f); }

export function marcar(chave, valor) {
  if (!userId || !ehChaveApp(chave)) return;
  pendentes.set(chave, valor);
  setEstado("salvando");
  clearTimeout(timer);
  timer = setTimeout(enviar, 800);
}

async function enviar() {
  if (!userId || !pendentes.size) return;
  const lote = [...pendentes.entries()];
  pendentes.clear();
  const ups = lote.filter(([, v]) => v !== null).map(([chave, valor]) => ({ user_id: userId, chave, valor, updated_at: new Date().toISOString() }));
  const dels = lote.filter(([, v]) => v === null).map(([k]) => k);
  try {
    if (ups.length) { const { error } = await supabase.from("dados_usuario").upsert(ups); if (error) throw error; }
    if (dels.length) { const { error } = await supabase.from("dados_usuario").delete().eq("user_id", userId).in("chave", dels); if (error) throw error; }
    setEstado(pendentes.size ? "salvando" : "salvo");
  } catch (e) {
    console.error(e);
    lote.forEach(([k, v]) => { if (!pendentes.has(k)) pendentes.set(k, v); });
    setEstado("erro");
    clearTimeout(timer);
    timer = setTimeout(enviar, 5000);
  }
}

// Ao entrar: baixa os dados da conta. Se a conta estiver vazia, envia o que já existe no aparelho.
export async function iniciarSync(uid) {
  userId = uid;
  const s = window.localStorage;
  const { data, error } = await supabase.from("dados_usuario").select("chave, valor").eq("user_id", uid).range(0, 9999);
  if (error) throw error;
  const locais = [];
  for (let i = 0; i < s.length; i++) { const k = s.key(i); if (ehChaveApp(k)) locais.push(k); }
  const ultimo = s.getItem("nuvem:usuario");
  if (!data.length && (!ultimo || ultimo === uid)) {
    locais.forEach((k) => marcar(k, s.getItem(k)));
    await enviar();
  } else {
    locais.forEach((k) => s.removeItem(k));
    data.forEach((r) => r.valor !== null && s.setItem(r.chave, r.valor));
  }
  s.setItem("nuvem:usuario", uid);
}

export async function pararSync() {
  await enviar();
  userId = null;
}
