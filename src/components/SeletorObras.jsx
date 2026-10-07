import { useState } from "react";
import { Plus, Copy, Trash2, Layers, Pencil } from "lucide-react";
import { listarObras, obraAtual, selecionarObra, criarObra, duplicarObra, excluirObra, listarSetores, criarSetor, renomearSetor } from "@/lib/local-storage-api";

export default function SeletorObras({ atual, onTrocar }) {
  const [obras, setObras] = useState(() => listarObras());
  const recarregar = () => setObras(listarObras());
  const btn = { background: "transparent", border: "1px solid #4A4F54", borderRadius: 3, color: "#F5F5F2", padding: "5px 9px", display: "flex", alignItems: "center", gap: 5, fontSize: 12, cursor: "pointer" };
  const sel = { background: "#1C1F22", color: "#F5F5F2", border: "1px solid #4A4F54", borderRadius: 3, padding: "5px 8px", fontSize: 13, maxWidth: 240 };

  const atualObj = obras.find((o) => o.id === atual);
  const paiId = atualObj?.pai || atual;
  const principais = obras.filter((o) => !o.pai);
  const setores = listarSetores(atual);
  const trocar = (id) => { selecionarObra(id); onTrocar(id); recarregar(); };

  return (
    <div className="no-print" style={{ background: "#2A2E33", color: "#F5F5F2", padding: "8px 20px", display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span style={{ color: "#9AA0A4" }}>Obra:</span>
        <select aria-label="Obra atual" value={paiId} onFocus={recarregar} onMouseDown={recarregar} onChange={(e) => trocar(e.target.value)} style={sel}>
          {principais.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
        <button style={btn} onClick={() => trocar(criarObra(""))}><Plus size={14} aria-hidden="true" /> Nova</button>
        <button style={btn} onClick={() => trocar(duplicarObra(atual))}><Copy size={14} aria-hidden="true" /> Duplicar</button>
        <button
          style={btn}
          onClick={() => {
            const nome = obras.find((o) => o.id === paiId)?.nome || "esta obra";
            if (!window.confirm(`Excluir "${nome}", todos os seus setores e itens? Isso não pode ser desfeito.`)) return;
            excluirObra(paiId);
            onTrocar(obraAtual());
            recarregar();
          }}
        ><Trash2 size={14} aria-hidden="true" /> Excluir</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span style={{ color: "#9AA0A4" }}>Setor / projeto:</span>
        <select aria-label="Setor ou projeto atual" value={atual} onChange={(e) => trocar(e.target.value)} style={sel}>
          {setores.map((o) => <option key={o.id} value={o.id}>{o.pai ? o.setor || "Setor sem nome" : "Principal"}</option>)}
        </select>
        <button style={btn} onClick={() => {
          const nome = window.prompt("Nome do setor ou projeto (ex.: Bloco A, Subsolo, Cozinha):");
          if (nome && nome.trim()) trocar(criarSetor(atual, nome.trim()));
        }}><Layers size={14} aria-hidden="true" /> Novo setor</button>
        {atualObj?.pai && (
          <>
            <button style={btn} onClick={() => {
              const nome = window.prompt("Novo nome do setor:", atualObj.setor);
              if (nome && nome.trim()) { renomearSetor(atual, nome.trim()); recarregar(); }
            }}><Pencil size={14} aria-hidden="true" /> Renomear</button>
            <button style={btn} onClick={() => {
              if (!window.confirm(`Excluir o setor "${atualObj.setor}" e seus itens?`)) return;
              excluirObra(atual);
              onTrocar(obraAtual());
              recarregar();
            }}><Trash2 size={14} aria-hidden="true" /> Excluir setor</button>
          </>
        )}
      </div>
    </div>
  );
}
