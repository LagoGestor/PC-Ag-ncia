"use client";

import { useMemo, useState } from "react";
import { AREAS, RESPONSAVEIS, STATUSES, STATUS_BADGE_CLASS, STATUS_COLORS, Tarefa, TIPOS } from "@/types";
import { fmtDate, isOverdue } from "./TaskCard";
import { Avatar } from "./Avatar";
import { useIsMobile } from "@/hooks/useIsMobile";

interface Filters {
  tarefa: string;
  area: string;
  tipo: string;
  responsavel: string;
  descricao: string;
  solicitacao: string;
  feedback: string;
  entrega: string;
  status: string;
}

const emptyFilters: Filters = {
  tarefa: "",
  area: "",
  tipo: "",
  responsavel: "",
  descricao: "",
  solicitacao: "",
  feedback: "",
  entrega: "",
  status: "",
};

interface Props {
  list: Tarefa[];
  onEdit: (t: Tarefa) => void;
  onToggleArchive: (t: Tarefa) => void;
  onDelete: (t: Tarefa) => void;
}

export function TabelaView({ list, onEdit, onToggleArchive, onDelete }: Props) {
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sort, setSort] = useState<{ field: keyof Tarefa; asc: boolean } | null>(null);
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());

  function setFilter<K extends keyof Filters>(key: K, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function toggleExpand(key: string) {
    setExpandedCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filtered = useMemo(() => {
    let rows = list.filter((t) => {
      if (filters.tarefa && !t.tarefa.toLowerCase().includes(filters.tarefa.toLowerCase())) return false;
      if (filters.area && t.area !== filters.area) return false;
      if (filters.tipo && t.tipo !== filters.tipo) return false;
      if (filters.responsavel && t.responsavel !== filters.responsavel) return false;
      if (filters.descricao && !t.descricao.toLowerCase().includes(filters.descricao.toLowerCase())) return false;
      if (filters.solicitacao && t.solicitacao !== filters.solicitacao) return false;
      if (filters.feedback && t.feedback !== filters.feedback) return false;
      if (filters.entrega && t.entrega !== filters.entrega) return false;
      if (filters.status && t.status !== filters.status) return false;
      return true;
    });

    if (sort) {
      rows = [...rows].sort((a, b) => {
        const da = new Date((a[sort.field] as string) || "9999-12-31").getTime();
        const db = new Date((b[sort.field] as string) || "9999-12-31").getTime();
        return sort.asc ? da - db : db - da;
      });
    }

    return rows;
  }, [list, filters, sort]);

  const fv = (k: keyof Filters) => filters[k];

  if (isMobile) {
    return (
      <div className="table-wrap">
        <table className="table-lista-mobile">
          <colgroup>
            <col style={{ width: "16%" }} />
            <col style={{ width: "60%" }} />
            <col style={{ width: "24%" }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ textAlign: "center" }}>
                <div className="th-inner">
                  <span className="th-label">TIME</span>
                  <select className="th-filter" value={fv("responsavel")} onChange={(e) => setFilter("responsavel", e.target.value)}>
                    <option value="">Todos</option>
                    {RESPONSAVEIS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </th>
              <th>
                <div className="th-inner">
                  <span className="th-label">TAREFA</span>
                  <input className="th-filter" placeholder="Filtrar..." value={fv("tarefa")} onChange={(e) => setFilter("tarefa", e.target.value)} />
                </div>
              </th>
              <th>
                <div className="th-inner">
                  <span className="th-label">
                    PRAZO
                    <span className="th-sort">
                      <button className="sort-btn" onClick={() => setSort({ field: "entrega", asc: true })}>▲</button>
                      <button className="sort-btn" onClick={() => setSort({ field: "entrega", asc: false })}>▼</button>
                    </span>
                  </span>
                  <input type="date" className="th-filter" value={fv("entrega")} onChange={(e) => setFilter("entrega", e.target.value)} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const overdue = isOverdue(t.entrega) && t.status !== "Concluído" && t.status !== "Cancelado";
              return (
                <tr key={t.id}>
                  <td style={{ textAlign: "center", verticalAlign: "top" }}>
                    <Avatar name={t.responsavel} size={26} ringColor={STATUS_COLORS[t.status]} />
                  </td>
                  <td className="expandable-clamp2 tarefa-link" style={{ verticalAlign: "top" }} onClick={() => onEdit(t)}>
                    <b>{t.tarefa}</b>
                  </td>
                  <td className={overdue ? "overdue-date" : ""} style={{ verticalAlign: "top" }}>
                    {fmtDate(t.entrega)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <colgroup>
          <col style={{ width: "15%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "19%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "6%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>
              <div className="th-inner">
                <span className="th-label">Tarefa</span>
                <input className="th-filter" placeholder="Filtrar..." value={fv("tarefa")} onChange={(e) => setFilter("tarefa", e.target.value)} />
              </div>
            </th>
            <th>
              <div className="th-inner">
                <span className="th-label">Área</span>
                <select className="th-filter" value={fv("area")} onChange={(e) => setFilter("area", e.target.value)}>
                  <option value="">Todas</option>
                  {AREAS.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </div>
            </th>
            <th>
              <div className="th-inner">
                <span className="th-label">Tipo</span>
                <select className="th-filter" value={fv("tipo")} onChange={(e) => setFilter("tipo", e.target.value)}>
                  <option value="">Todos</option>
                  {TIPOS.map((tp) => (
                    <option key={tp}>{tp}</option>
                  ))}
                </select>
              </div>
            </th>
            <th>
              <div className="th-inner">
                <span className="th-label">Responsável</span>
                <select className="th-filter" value={fv("responsavel")} onChange={(e) => setFilter("responsavel", e.target.value)}>
                  <option value="">Todos</option>
                  {RESPONSAVEIS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
            </th>
            <th>
              <div className="th-inner">
                <span className="th-label">Descrição</span>
                <input className="th-filter" placeholder="Filtrar..." value={fv("descricao")} onChange={(e) => setFilter("descricao", e.target.value)} />
              </div>
            </th>
            <th>
              <div className="th-inner">
                <span className="th-label">
                  Solicit.
                  <span className="th-sort">
                    <button className="sort-btn" onClick={() => setSort({ field: "solicitacao", asc: true })}>▲</button>
                    <button className="sort-btn" onClick={() => setSort({ field: "solicitacao", asc: false })}>▼</button>
                  </span>
                </span>
                <input type="date" className="th-filter" value={fv("solicitacao")} onChange={(e) => setFilter("solicitacao", e.target.value)} />
              </div>
            </th>
            <th>
              <div className="th-inner">
                <span className="th-label">
                  Feedback
                  <span className="th-sort">
                    <button className="sort-btn" onClick={() => setSort({ field: "feedback", asc: true })}>▲</button>
                    <button className="sort-btn" onClick={() => setSort({ field: "feedback", asc: false })}>▼</button>
                  </span>
                </span>
                <input type="date" className="th-filter" value={fv("feedback")} onChange={(e) => setFilter("feedback", e.target.value)} />
              </div>
            </th>
            <th>
              <div className="th-inner">
                <span className="th-label">
                  Entrega
                  <span className="th-sort">
                    <button className="sort-btn" onClick={() => setSort({ field: "entrega", asc: true })}>▲</button>
                    <button className="sort-btn" onClick={() => setSort({ field: "entrega", asc: false })}>▼</button>
                  </span>
                </span>
                <input type="date" className="th-filter" value={fv("entrega")} onChange={(e) => setFilter("entrega", e.target.value)} />
              </div>
            </th>
            <th>
              <div className="th-inner">
                <span className="th-label">Postar às</span>
              </div>
            </th>
            <th>
              <div className="th-inner">
                <span className="th-label">Status</span>
                <select className="th-filter" value={fv("status")} onChange={(e) => setFilter("status", e.target.value)}>
                  <option value="">Todos</option>
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </th>
            <th style={{ textAlign: "center" }}>
              <div className="th-inner">
                <span className="th-label">Ações</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((t) => {
            const overdue = isOverdue(t.entrega) && t.status !== "Concluído" && t.status !== "Cancelado";
            const descKey = `${t.id}-desc`;
            const titleKey = `${t.id}-title`;
            return (
              <tr key={t.id}>
                <td
                  className={`expandable task-name-cell${expandedCells.has(titleKey) ? " expanded" : ""}`}
                  onClick={() => toggleExpand(titleKey)}
                >
                  <b>{t.tarefa}</b>
                </td>
                <td>{t.area}</td>
                <td>{t.tipo || "—"}</td>
                <td>
                  <span className="resp-inline">
                    <Avatar name={t.responsavel} size={16} ringColor={STATUS_COLORS[t.status]} /> {t.responsavel}
                  </span>
                </td>
                <td
                  className={`expandable${expandedCells.has(descKey) ? " expanded" : ""}`}
                  onClick={() => toggleExpand(descKey)}
                >
                  {t.descricao || "—"}
                </td>
                <td>{fmtDate(t.solicitacao)}</td>
                <td>{fmtDate(t.feedback)}</td>
                <td className={overdue ? "overdue-date" : ""}>{fmtDate(t.entrega)}</td>
                <td>{t.horarioPublicacao || "—"}</td>
                <td>
                  <span className={`card-badge ${STATUS_BADGE_CLASS[t.status] || ""}`}>{t.status}</span>
                </td>
                <td>
                  <div className="tbl-actions">
                    <button className="tbl-action-icon" onClick={() => onEdit(t)} title="Editar">
                      <i className="fas fa-pen" />
                    </button>
                    <button className="tbl-action-icon" onClick={() => onToggleArchive(t)} title="Arquivar">
                      <i className="fas fa-box-archive" />
                    </button>
                    <button className="tbl-action-icon danger" onClick={() => onDelete(t)} title="Apagar">
                      <i className="fas fa-trash" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
