"use client";

import { FormEvent, useEffect, useState } from "react";
import { RedeSocial } from "@/types";

interface PostForm {
  rede: RedeSocial;
  tipo: string;
  titulo: string;
  link: string;
  publicadoEm: string;
  alcance: number;
  visualizacoes: number;
  curtidas: number;
  comentarios: number;
  compartilhamentos: number;
  salvamentos: number;
  taxaEngajamento: number;
}

const emptyPost = (): PostForm => ({
  rede: "INSTAGRAM",
  tipo: "",
  titulo: "",
  link: "",
  publicadoEm: "",
  alcance: 0,
  visualizacoes: 0,
  curtidas: 0,
  comentarios: 0,
  compartilhamentos: 0,
  salvamentos: 0,
  taxaEngajamento: 0,
});

const emptyForm = {
  inicioSemana: "",
  igSeguidores: 0,
  igSeguidoresGanhos: 0,
  igContasAlcancadas: 0,
  igImpressoes: 0,
  igVisualizacoes: 0,
  igCurtidas: 0,
  igComentarios: 0,
  igCompartilhamentos: 0,
  igSalvamentos: 0,
  igStoriesPublicados: 0,
  igStoriesAlcance: 0,
  igStoriesImpressoes: 0,
  igStoriesRespostas: 0,
  igStoriesSaidas: 0,
  igStoriesAvancos: 0,
  igStoriesVoltas: 0,
  ytInscritos: 0,
  ytInscritosGanhos: 0,
  ytVisualizacoes: 0,
  ytImpressoes: 0,
  ytCtr: 0,
  ytTempoExibicaoMin: 0,
  ytDuracaoMediaSeg: 0,
};

type FormState = typeof emptyForm;

function segundaFeiraDaSemanaAtual(): string {
  const hoje = new Date();
  const dia = hoje.getDay();
  const diff = (dia + 6) % 7;
  const seg = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - diff);
  return `${seg.getFullYear()}-${String(seg.getMonth() + 1).padStart(2, "0")}-${String(seg.getDate()).padStart(2, "0")}`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function PerformanceEntryModal({ open, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [posts, setPosts] = useState<PostForm[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm, inicioSemana: segundaFeiraDaSemanaAtual() });
      setPosts([]);
      setError("");
    }
  }, [open]);

  if (!open) return null;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setPost<K extends keyof PostForm>(index: number, key: K, value: PostForm[K]) {
    setPosts((prev) => prev.map((p, i) => (i === index ? { ...p, [key]: value } : p)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.inicioSemana) {
      setError("Informe a segunda-feira da semana.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, posts }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao salvar.");
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  const numField = (label: string, key: keyof FormState) => (
    <div className="form-group">
      <label>{label}</label>
      <input
        type="number"
        className="form-control"
        value={form[key]}
        onChange={(e) => set(key, Number(e.target.value) as FormState[typeof key])}
      />
    </div>
  );

  return (
    <div className="modal-overlay open">
      <div className="modal-box" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <span className="modal-title">Lançar dados da semana</span>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>
              Segunda-feira da semana <span>*</span>
            </label>
            <input
              type="date"
              className="form-control"
              value={form.inicioSemana}
              onChange={(e) => set("inicioSemana", e.target.value)}
              required
            />
          </div>

          <h4 className="performance-form-section">📈 Crescimento</h4>
          <div className="form-row">
            {numField("Seguidores Instagram (total)", "igSeguidores")}
            {numField("Seguidores ganhos na semana", "igSeguidoresGanhos")}
          </div>

          <h4 className="performance-form-section">👁️ Alcance</h4>
          <div className="form-row">
            {numField("Contas alcançadas", "igContasAlcancadas")}
            {numField("Impressões", "igImpressoes")}
          </div>
          <div className="form-row">{numField("Visualizações (Reels/vídeos)", "igVisualizacoes")}</div>

          <h4 className="performance-form-section">💬 Engajamento</h4>
          <div className="form-row">
            {numField("Curtidas", "igCurtidas")}
            {numField("Comentários", "igComentarios")}
          </div>
          <div className="form-row">
            {numField("Compartilhamentos", "igCompartilhamentos")}
            {numField("Salvamentos", "igSalvamentos")}
          </div>

          <h4 className="performance-form-section">📖 Stories</h4>
          <div className="form-row">
            {numField("Stories publicados", "igStoriesPublicados")}
            {numField("Alcance dos stories", "igStoriesAlcance")}
          </div>
          <div className="form-row">
            {numField("Impressões dos stories", "igStoriesImpressoes")}
            {numField("Respostas", "igStoriesRespostas")}
          </div>
          <div className="form-row">
            {numField("Saídas (exits)", "igStoriesSaidas")}
            {numField("Avanços / voltas (taps)", "igStoriesAvancos")}
          </div>

          <h4 className="performance-form-section">▶️ YouTube</h4>
          <div className="form-row">
            {numField("Inscritos (total)", "ytInscritos")}
            {numField("Inscritos ganhos na semana", "ytInscritosGanhos")}
          </div>
          <div className="form-row">
            {numField("Visualizações", "ytVisualizacoes")}
            {numField("Impressões", "ytImpressoes")}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>CTR (%)</label>
              <input
                type="number"
                step="0.1"
                className="form-control"
                value={form.ytCtr}
                onChange={(e) => set("ytCtr", Number(e.target.value))}
              />
            </div>
            {numField("Tempo de exibição (min)", "ytTempoExibicaoMin")}
          </div>
          <div className="form-row">{numField("Duração média de visualização (seg)", "ytDuracaoMediaSeg")}</div>

          <h4 className="performance-form-section">🎥 Desempenho de conteúdo (opcional)</h4>
          {posts.map((p, i) => (
            <div key={i} className="performance-post-row">
              <div className="form-row">
                <div className="form-group">
                  <label>Rede</label>
                  <select
                    className="form-control"
                    value={p.rede}
                    onChange={(e) => setPost(i, "rede", e.target.value as RedeSocial)}
                  >
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="YOUTUBE">YouTube</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Reels, Carrossel, Vídeo..."
                    value={p.tipo}
                    onChange={(e) => setPost(i, "tipo", e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Título</label>
                <input
                  type="text"
                  className="form-control"
                  value={p.titulo}
                  onChange={(e) => setPost(i, "titulo", e.target.value)}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Alcance/visualizações</label>
                  <input
                    type="number"
                    className="form-control"
                    value={p.alcance}
                    onChange={(e) => setPost(i, "alcance", Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>Taxa de engajamento (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    value={p.taxaEngajamento}
                    onChange={(e) => setPost(i, "taxaEngajamento", Number(e.target.value))}
                  />
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setPosts((prev) => prev.filter((_, idx) => idx !== i))}
              >
                <i className="fas fa-trash" /> Remover post
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPosts((prev) => [...prev, emptyPost()])}>
            <i className="fas fa-plus" /> Adicionar post/vídeo
          </button>

          {error && <div style={{ color: "var(--danger)", fontSize: 12, margin: "14px 0 0" }}>{error}</div>}

          <div className="form-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-accent" disabled={saving}>
              <i className="fas fa-save" /> {saving ? "Salvando..." : "Salvar semana"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
