import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Levantamento Elétrico" },
      { name: "description", content: "Crie uma nova senha para sua conta do Levantamento Elétrico." },
      { property: "og:title", content: "Nova senha — Levantamento Elétrico" },
      { property: "og:description", content: "Crie uma nova senha para sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) return setMsg(error.message);
    navigate({ to: "/", replace: true });
  };
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#F5F5F2" }}>
      <form onSubmit={salvar} style={{ background: "#fff", padding: 28, borderRadius: 6, border: "1px solid #DDD", width: "100%", maxWidth: 380 }}>
        <h1 style={{ fontSize: 20, marginTop: 0 }}>Criar nova senha</h1>
        <input type="password" required minLength={6} placeholder="Nova senha" value={senha} onChange={(e) => setSenha(e.target.value)}
          style={{ width: "100%", padding: 10, border: "1px solid #C9CCCF", borderRadius: 4, marginBottom: 10, boxSizing: "border-box" }} />
        <button style={{ width: "100%", padding: 11, background: "#1C1F22", color: "#F5F5F2", border: "none", borderRadius: 4 }}>Salvar senha</button>
        {msg && <p>{msg}</p>}
      </form>
    </div>
  );
}
