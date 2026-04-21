import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { adminGetEstatisticas } from "../../lib/api";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface Kpis {
  total_geral: number;
  total_turma_ativa: number;
  turma_ativa_nome: string | null;
  total_turmas: number;
  total_hoje: number;
}

interface DiaItem { data: string; quantidade: number }
interface TurmaItem { turma: string; quantidade: number }
interface HoraItem { hora: string; quantidade: number }
interface RecenteItem { nome: string; turma: string; data: string }

interface Estatisticas {
  kpis: Kpis;
  grafico_por_dia: DiaItem[];
  grafico_por_turma: TurmaItem[];
  grafico_por_hora: HoraItem[];
  grafico_top_dias: DiaItem[];
  recentes: RecenteItem[];
}

const COLORS = ["#4361ee", "#3a0ca3", "#7209b7", "#f72585", "#4cc9f0", "#06d6a0", "#ffd166", "#ef476f"];

function KpiCard({
  icon, color, value, label, sub,
}: { icon: string; color: string; value: number; label: string; sub?: string }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3 p-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center"
            style={{ width: 56, height: 56, background: color + "22", flexShrink: 0 }}
          >
            <i className={`bi ${icon} fs-3`} style={{ color }} />
          </div>
          <div>
            <div className="fs-2 fw-bold lh-1">{value.toLocaleString("pt-BR")}</div>
            <div className="text-muted small">{label}</div>
            {sub && <div className="text-muted" style={{ fontSize: 11 }}>{sub}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Estatisticas() {
  const [dados, setDados] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    adminGetEstatisticas()
      .then(setDados)
      .catch((e: Error) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (erro || !dados) {
    return (
      <AdminLayout>
        <div className="alert alert-danger">{erro || "Erro ao carregar estatísticas"}</div>
      </AdminLayout>
    );
  }

  const { kpis, grafico_por_dia, grafico_por_turma, grafico_por_hora, grafico_top_dias, recentes } = dados;

  return (
    <AdminLayout>
      <h4 className="fw-bold mb-4">
        <i className="bi bi-bar-chart-line me-2 text-primary" />
        Estatísticas
      </h4>

      {/* KPIs */}
      <div className="row g-3 mb-4">
        <KpiCard icon="bi-award-fill" color="#4361ee" value={kpis.total_geral} label="Certificados emitidos (total)" />
        <KpiCard
          icon="bi-bookmark-star-fill"
          color="#7209b7"
          value={kpis.total_turma_ativa}
          label="Certificados da turma ativa"
          sub={kpis.turma_ativa_nome ?? undefined}
        />
        <KpiCard icon="bi-collection-fill" color="#06d6a0" value={kpis.total_turmas} label="Turmas cadastradas" />
        <KpiCard icon="bi-calendar-check-fill" color="#f72585" value={kpis.total_hoje} label="Emissões hoje" />
      </div>

      {/* Linha: emissões por dia */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h6 className="fw-bold mb-3">Emissões por dia (últimos 30 dias)</h6>
          {grafico_por_dia.length === 0 ? (
            <p className="text-muted text-center py-3">Sem dados suficientes</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={grafico_por_dia} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => [Number(v), "Certificados"]}
                  labelFormatter={(l) => `Data: ${l}`}
                />
                <Line type="monotone" dataKey="quantidade" stroke="#4361ee" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Barras: por turma + por hora */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Emissões por turma</h6>
              {grafico_por_turma.length === 0 ? (
                <p className="text-muted text-center py-3">Sem dados</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={grafico_por_turma} layout="vertical" margin={{ left: 16, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="turma" tick={{ fontSize: 11 }} width={110} />
                    <Tooltip formatter={(v) => [Number(v), "Certificados"]} />
                    <Bar dataKey="quantidade" radius={[0, 4, 4, 0]}>
                      {grafico_por_turma.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Distribuição por hora do dia</h6>
              {grafico_por_hora.every((h) => h.quantidade === 0) ? (
                <p className="text-muted text-center py-3">Sem dados</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={grafico_por_hora} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="hora" tick={{ fontSize: 10 }} interval={1} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [Number(v), "Certificados"]} />
                    <Bar dataKey="quantidade" fill="#4cc9f0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top 10 dias */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h6 className="fw-bold mb-3">Top 10 dias com mais emissões</h6>
          {grafico_top_dias.length === 0 ? (
            <p className="text-muted text-center py-3">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={grafico_top_dias} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [Number(v), "Certificados"]} labelFormatter={(l) => `Data: ${l}`} />
                <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
                  {grafico_top_dias.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Atividade recente */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 pt-3 pb-0">
          <h6 className="fw-bold">Atividade recente (últimos 20 certificados)</h6>
        </div>
        <div className="card-body p-0">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Nome</th>
                <th>Turma</th>
                <th>Data / Hora</th>
              </tr>
            </thead>
            <tbody>
              {recentes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-muted py-4">Nenhum certificado registrado</td>
                </tr>
              ) : (
                recentes.map((r, i) => (
                  <tr key={i}>
                    <td>{r.nome}</td>
                    <td>{r.turma}</td>
                    <td>{new Date(r.data).toLocaleString("pt-BR")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
