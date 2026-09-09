import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import LevantamentoEletrico from "@/components/LevantamentoEletrico";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Levantamento de Material Elétrico" },
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <LevantamentoEletrico />;
}
