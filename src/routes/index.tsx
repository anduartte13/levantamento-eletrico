import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import LevantamentoEletrico from "@/components/LevantamentoEletrico";
import { supabase } from "@/integrations/supabase/client";
// @ts-ignore
import SeletorObras from "@/components/SeletorObras";
// @ts-ignore
import TelaLogin from "@/components/TelaLogin";
// @ts-ignore
import { obraAtual } from "@/lib/local-storage-api";
// @ts-ignore
import { iniciarSync, pararSync, ouvirEstado } from "@/lib/nuvem-sync";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LevE+ | Eletron Watts Construções" },
      {
        name: "description",
        content:
          "Organize categorias, calcule cabos, eletrodutos e tomadas e acompanhe o que já foi adquirido na obra.",
      },
      { property: "og:title", content: "Levantamento de Material Elétrico" },
      {
        property: "og:description",
        content:
          "Lista de materiais elétricos com calculadora de cabos, infraestrutura e tomadas para obras.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [pronto, setPronto] = useState(false);
  const [obra, setObra] = useState<string | null>(null);
  const [estado, setEstado] = useState("salvo");
  const [anuncioSalvo, setAnuncioSalvo] = useState("");
  const estadoAnterior = useRef("salvo");
  useEffect(() => {
    const antes = estadoAnterior.current;
    estadoAnterior.current = estado;
    if (estado === "salvo" && antes !== "salvo") setAnuncioSalvo(`Salvamento concluído às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`);
    else if (estado === "erro" && antes !== "erro") setAnuncioSalvo("Sem conexão. As alterações serão salvas quando a internet voltar.");
  }, [estado]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user.id ?? null);
      setEmail(session?.user.email ?? "");
    });
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setEmail(data.session?.user.email ?? "");
    });
    const off = ouvirEstado(setEstado);
    return () => { data.subscription.unsubscribe(); off(); };
  }, []);

  useEffect(() => {
    setPronto(false);
    if (!userId) return;
    let ativo = true;
    iniciarSync(userId)
      .catch((e: unknown) => console.error(e))
      .finally(() => { if (ativo) { setObra(obraAtual()); setPronto(true); } });
    return () => { ativo = false; };
  }, [userId]);

  if (userId === undefined) return null;
  if (!userId) return <TelaLogin />;
  if (!pronto || !obra) return <p style={{ padding: 24 }}>Carregando suas obras...</p>;

  const sair = async () => { await pararSync(); await supabase.auth.signOut(); };
  const textoEstado = estado === "salvando" ? "Salvando..." : estado === "erro" ? "Sem conexão — tentando de novo" : "Tudo salvo na nuvem";

  const status = (
    <span title={textoEstado} style={{ color: estado === "erro" ? "#E8A33D" : "#8FC79A", fontSize: 12, whiteSpace: "nowrap" }}>
      <span aria-hidden="true">● </span>{estado === "salvando" ? "Salvando..." : estado === "erro" ? "Sem conexão" : "Salvo"}
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">{anuncioSalvo}</span>
    </span>
  );

  return (
    <>
      <SeletorObras atual={obra} onTrocar={setObra} status={status} email={email} onSair={sair} />
      <LevantamentoEletrico key={obra} />
    </>
  );
}
