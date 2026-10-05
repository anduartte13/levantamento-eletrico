import { useState } from "react";
import { Plus, Copy, Trash2 } from "lucide-react";
import { listarObras, obraAtual, selecionarObra, criarObra, duplicarObra, excluirObra } from "@/lib/local-storage-api";

export default function SeletorObras({ atual, onTrocar }) {
  const [obras, setObras] = useState(() => listarObras());
  const recarregar = () => setObras(listarObras());
  const btn = { background: "transparent", border: "1px solid #4A4F54", borderRadius: 3, color: "#F5F5F2", padding: "5px 9px", display: "flex", alignItems: "center", gap: 5, fontSize: 12, cursor: "pointer" };

  return (
    <div className="no-print" style={{ background: "#2A2E33", color: "#F5F5F2", padding: "8px 20px", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: 13 }}>
      <span style={{ color: "#9AA0A4" }}>Obra:</span>
      <select aria-label="Obra atual"
        value={atual}
        onFocus={recarregar}
        onMouseDown={recarregar}
        onChange={(e) => { selecionarObra(e.target.value); onTrocar(e.target.value); }}
        style={{ background: "#1C1F22", color: "#F5F5F2", border: "1px solid #4A4F54", borderRadius: 3, padding: "5px 8px", fontSize: 13, maxWidth: 240 }}
      >
        {obras.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
      </select>
      <button style={btn} onClick={() => { onTrocar(criarObra("")); recarregar(); }}><Plus size={14} /> Nova</button>
      <button style={btn} onClick={() => { onTrocar(duplicarObra(atual)); recarregar(); }}><Copy size={14} /> Duplicar</button>
      <button
        style={btn}
        onClick={() => {
          const nome = obras.find((o) => o.id === atual)?.nome || "esta obra";
          if (!window.confirm(`Excluir "${nome}" e todos os seus itens? Isso não pode ser desfeito.`)) return;
          excluirObra(atual);
          onTrocar(obraAtual());
          recarregar();
        }}
      ><Trash2 size={14} /> Excluir</button>
    </div>
  );
}
