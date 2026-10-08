import { useState, useRef } from "react";
import { Plus, Copy, Trash2, Layers, Pencil, MoreVertical, LogOut } from "lucide-react";
import { listarObras, obraAtual, selecionarObra, criarObra, duplicarObra, excluirObra, listarSetores, criarSetor, renomearSetor } from "@/lib/local-storage-api";

export default function SeletorObras({ atual, onTrocar, status, email, onSair }) {
  const [obras, setObras] = useState(() => listarObras());
  const menuRef = useRef(null);
  const recarregar = () => setObras(listarObras());
  const fechar = () => { if (menuRef.current) menuRef.current.open = false; };
  const item = { background: "transparent", border: "none", color: "#F5F5F2", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer", width: "100%", textAlign: "left", minHeight: 44 };
  const sel = { background: "#1C1F22", color: "#F5F5F2", border: "1px solid #4A4F54", borderRadius: 4, padding: "8px", fontSize: 14, minHeight: 40, flex: "1 1 130px", minWidth: 0, maxWidth: 260 };

  const atualObj = obras.find((o) => o.id === atual);
  const paiId = atualObj?.pai || atual;
  const principais = obras.filter((o) => !o.pai);
  const setores = listarSetores(atual);
  const trocar = (id) => { selecionarObra(id); onTrocar(id); recarregar(); };
  const acao = (f) => () => { fechar(); f(); };

  return (
    <div className="no-print" style={{ background: "#2A2E33", color: "#F5F5F2", padding: "8px 14px", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: 13 }}>
      {status}
      <select aria-label="Obra atual" value={paiId} onFocus={recarregar} onMouseDown={recarregar} onChange={(e) => trocar(e.target.value)} style={sel}>
        {principais.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
      </select>
      <select aria-label="Setor ou projeto atual" value={atual} onChange={(e) => trocar(e.target.value)} style={sel}>
        {setores.map((o) => <option key={o.id} value={o.id}>{o.pai ? o.setor || "Setor sem nome" : "Principal"}</option>)}
      </select>
      <details ref={menuRef} style={{ position: "relative", marginLeft: "auto" }}>
        <summary aria-label="Mais opções" style={{ listStyle: "none", cursor: "pointer", border: "1px solid #4A4F54", borderRadius: 4, padding: 8, display: "flex", minHeight: 40, alignItems: "center" }}>
          <MoreVertical size={18} aria-hidden="true" />
        </summary>
        <div role="menu" style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "#1C1F22", border: "1px solid #4A4F54", borderRadius: 6, minWidth: 220, zIndex: 60, boxShadow: "0 8px 24px rgba(0,0,0,.35)", overflow: "hidden" }}>
          {email && <div style={{ padding: "10px 14px", color: "#9AA0A4", fontSize: 12, borderBottom: "1px solid #4A4F54", wordBreak: "break-all" }}>{email}</div>}
          <button style={item} onClick={acao(() => trocar(criarObra("")))}><Plus size={16} aria-hidden="true" /> Nova obra</button>
          <button style={item} onClick={acao(() => trocar(duplicarObra(atual)))}><Copy size={16} aria-hidden="true" /> Duplicar obra</button>
          <button style={item} onClick={acao(() => {
            const nome = window.prompt("Nome do setor ou projeto (ex.: Bloco A, Subsolo, Cozinha):");
            if (nome && nome.trim()) trocar(criarSetor(atual, nome.trim()));
          })}><Layers size={16} aria-hidden="true" /> Novo setor</button>
          {atualObj?.pai && (
            <>
              <button style={item} onClick={acao(() => {
                const nome = window.prompt("Novo nome do setor:", atualObj.setor);
                if (nome && nome.trim()) { renomearSetor(atual, nome.trim()); recarregar(); }
              })}><Pencil size={16} aria-hidden="true" /> Renomear setor</button>
              <button style={item} onClick={acao(() => {
                if (!window.confirm(`Excluir o setor "${atualObj.setor}" e seus itens?`)) return;
                excluirObra(atual); onTrocar(obraAtual()); recarregar();
              })}><Trash2 size={16} aria-hidden="true" /> Excluir setor</button>
            </>
          )}
          <button style={{ ...item, color: "#F2A5A5" }} onClick={acao(() => {
            const nome = obras.find((o) => o.id === paiId)?.nome || "esta obra";
            if (!window.confirm(`Excluir "${nome}", todos os seus setores e itens? Isso não pode ser desfeito.`)) return;
            excluirObra(paiId); onTrocar(obraAtual()); recarregar();
          })}><Trash2 size={16} aria-hidden="true" /> Excluir obra</button>
          {onSair && <button style={{ ...item, borderTop: "1px solid #4A4F54" }} onClick={acao(onSair)}><LogOut size={16} aria-hidden="true" /> Sair</button>}
        </div>
      </details>
    </div>
  );
}
