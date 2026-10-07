import logoAsset from "@/assets/logo-watts.jpg.asset.json";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export default function TelaLogin() {
  const [modo, setModo] = useState("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setOcupado(true); setMsg("");
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
      } else if (modo === "criar") {
        const { error } = await supabase.auth.signUp({ email, password: senha, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        setMsg("Conta criada! Abra seu e-mail e clique no link de confirmação para entrar.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setMsg("Enviamos um link para seu e-mail para criar uma nova senha.");
      }
    } catch (err) {
      const m = err.message || "";
      setMsg(m.includes("Invalid login") ? "E-mail ou senha incorretos." : m.includes("not confirmed") ? "Confirme seu e-mail antes de entrar." : m.includes("already") ? "Este e-mail já tem conta. Use Entrar." : m);
    }
    setOcupado(false);
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) setMsg("Não foi possível entrar com o Google.");
  };

  const campo = { width: "100%", padding: "10px 12px", border: "1px solid #C9CCCF", borderRadius: 4, fontSize: 15, boxSizing: "border-box", marginBottom: 10 };
  const botao = { width: "100%", padding: "11px", borderRadius: 4, fontSize: 15, cursor: "pointer", border: "none", fontWeight: 600 };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F2", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", border: "1px solid #DDD", borderRadius: 6, padding: 28, width: "100%", maxWidth: 380 }}>
        <img src={logoAsset.url} alt="Logo Eletron Watts Construções" style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8, display: "block", margin: "0 auto 12px" }} />
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15, color: "#1C1F22", marginBottom: 8 }}>Eletron Watts Construções</div>
        <h1 style={{ fontSize: 22, margin: "0 0 4px", color: "#1C1F22" }}>Levantamento Elétrico</h1>
        <p style={{ margin: "0 0 20px", color: "#666", fontSize: 14 }}>
          {modo === "entrar" ? "Entre para ver suas obras em qualquer aparelho." : modo === "criar" ? "Crie sua conta. Suas obras ficam salvas automaticamente." : "Informe seu e-mail para criar uma nova senha."}
        </p>
        <form onSubmit={enviar}>
          <input style={campo} type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          {modo !== "recuperar" && <input style={campo} type="password" required minLength={6} placeholder="Senha (mínimo 6)" value={senha} onChange={(e) => setSenha(e.target.value)} />}
          <button disabled={ocupado} style={{ ...botao, background: "#1C1F22", color: "#F5F5F2" }}>
            {ocupado ? "Aguarde..." : modo === "entrar" ? "Entrar" : modo === "criar" ? "Criar conta" : "Enviar link"}
          </button>
        </form>
        {modo !== "recuperar" && (
          <button onClick={google} style={{ ...botao, marginTop: 10, background: "#fff", color: "#1C1F22", border: "1px solid #C9CCCF" }}>Continuar com Google</button>
        )}
        {msg && <p style={{ marginTop: 14, fontSize: 14, color: "#1C1F22", background: "#F0F0EC", padding: 10, borderRadius: 4 }}>{msg}</p>}
        <div style={{ marginTop: 16, fontSize: 14, display: "flex", flexDirection: "column", gap: 6 }}>
          {modo !== "entrar" && <a href="#" onClick={(e) => { e.preventDefault(); setModo("entrar"); setMsg(""); }}>Já tenho conta — entrar</a>}
          {modo !== "criar" && <a href="#" onClick={(e) => { e.preventDefault(); setModo("criar"); setMsg(""); }}>Criar uma conta</a>}
          {modo === "entrar" && <a href="#" onClick={(e) => { e.preventDefault(); setModo("recuperar"); setMsg(""); }}>Esqueci minha senha</a>}
        </div>
      </div>
    </div>
  );
}
