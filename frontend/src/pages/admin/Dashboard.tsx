import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { adminGetEstatisticas } from "../../lib/api";
import { Link } from "react-router-dom";

interface Kpis {
  total_geral: number;
  total_turma_ativa: number;
  turma_ativa_nome: string | null;
  total_turmas: number;
  total_hoje: number;
}

interface DiaItem { data: string; quantidade: number }
interface RecenteItem { nome: string; turma: string; data: string }

interface Estatisticas {
  kpis: Kpis;
  grafico_por_dia: DiaItem[];
  recentes: RecenteItem[];
}

function tempoAtras(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  return `há ${Math.floor(hrs / 24)} dias`;
}

export default function Dashboard() {
  const [dados, setDados] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetEstatisticas()
      .then(setDados)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const kpis = dados?.kpis;
  const recentes = dados?.recentes ?? [];
  const ultimaEmissao = recentes[0]?.data ?? null;
  const semTurmaAtiva = kpis && !kpis.turma_ativa_nome;
  const ultimos7dias = (dados?.grafico_por_dia ?? []).slice(-7);
  const emissoesSemana = ultimos7dias.reduce((acc, d) => acc + d.quantidade, 0);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h4 className="fw-bold mb-0">Dashboard</h4>
        {ultimaEmissao && (
          <span className="text-muted small">
            <i className="bi bi-clock me-1" />
            Último certificado {tempoAtras(ultimaEmissao)}
          </span>
        )}
      </div>

      {/* Alerta sem turma ativa */}
      {!loading && semTurmaAtiva && (
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-exclamation-triangle-fill fs-5" />
          <span>
            Nenhuma turma está ativa. Os usuários não conseguem emitir certificados.{" "}
            <Link to="/admin/turmas" className="alert-link">Ativar uma turma</Link>.
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        {/* Turma ativa */}
        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: 44, height: 44, background: "#4361ee22", flexShrink: 0 }}>
                  <i className="bi bi-bookmark-star-fill fs-4" style={{ color: "#4361ee" }} />
                </div>
                <div className="text-muted small">Turma ativa</div>
              </div>
              {loading ? (
                <div className="placeholder-glow"><span className="placeholder col-8" /></div>
              ) : kpis?.turma_ativa_nome ? (
                <>
                  <div className="fw-bold text-truncate" style={{ fontSize: 15 }}>{kpis.turma_ativa_nome}</div>
                  <span className="badge bg-success mt-1">ATIVA</span>
                </>
              ) : (
                <div className="text-danger small fw-semibold">Sem turma ativa</div>
              )}
              <Link to="/admin/turmas" className="btn btn-sm btn-outline-primary mt-3 w-100">
                Gerenciar turmas
              </Link>
            </div>
          </div>
        </div>

        {/* Total certificados */}
        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <div className="d-flex align-items-center gap-2 mb-1">
                <div className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: 44, height: 44, background: "#06d6a022", flexShrink: 0 }}>
                  <i className="bi bi-award-fill fs-4" style={{ color: "#06d6a0" }} />
                </div>
                <div className="text-muted small">Total emitidos</div>
              </div>
              {loading ? (
                <div className="placeholder-glow"><span className="placeholder col-6 my-1" /></div>
              ) : (
                <div className="fs-2 fw-bold">{(kpis?.total_geral ?? 0).toLocaleString("pt-BR")}</div>
              )}
              <Link to="/admin/certificados" className="btn btn-sm btn-outline-success mt-2 w-100">
                Ver todos
              </Link>
            </div>
          </div>
        </div>

        {/* Emissões hoje */}
        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: 44, height: 44, background: "#f7255822", flexShrink: 0 }}>
                  <i className="bi bi-calendar-check-fill fs-4" style={{ color: "#f72585" }} />
                </div>
                <div className="text-muted small">Hoje</div>
              </div>
              {loading ? (
                <div className="placeholder-glow"><span className="placeholder col-4" /></div>
              ) : (
                <div className="fs-2 fw-bold">{kpis?.total_hoje ?? 0}</div>
              )}
              <div className="text-muted small mt-1">certificados emitidos hoje</div>
            </div>
          </div>
        </div>

        {/* Emissões esta semana */}
        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: 44, height: 44, background: "#ffd16622", flexShrink: 0 }}>
                  <i className="bi bi-calendar-week-fill fs-4" style={{ color: "#e6ac00" }} />
                </div>
                <div className="text-muted small">Esta semana</div>
              </div>
              {loading ? (
                <div className="placeholder-glow"><span className="placeholder col-4" /></div>
              ) : (
                <div className="fs-2 fw-bold">{emissoesSemana}</div>
              )}
              <div className="text-muted small mt-1">últimos 7 dias</div>
            </div>
          </div>
        </div>
      </div>

      {/* Atalhos rápidos */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <h6 className="fw-bold mb-3">
            <i className="bi bi-lightning-charge-fill text-warning me-2" />
            Atalhos rápidos
          </h6>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/admin/turmas" className="btn btn-outline-primary">
              <i className="bi bi-plus-circle me-2" />Nova turma
            </Link>
            <Link to="/admin/certificados" className="btn btn-outline-secondary">
              <i className="bi bi-download me-2" />Exportar CSV
            </Link>
            <Link to="/admin/estatisticas" className="btn btn-outline-info">
              <i className="bi bi-bar-chart-line me-2" />Ver estatísticas
            </Link>
            <a href="/" target="_blank" rel="noreferrer" className="btn btn-outline-success">
              <i className="bi bi-box-arrow-up-right me-2" />Página pública
            </a>
          </div>
        </div>
      </div>

      {/* Últimos certificados */}
      <h6 className="fw-bold mb-3">Últimos certificados emitidos</h6>
      <div className="card border-0 shadow-sm">
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th>Nome</th>
              <th>Turma</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary" />
                </td>
              </tr>
            )}
            {!loading && recentes.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-muted py-4">Nenhum certificado emitido</td>
              </tr>
            )}
            {recentes.slice(0, 10).map((c, i) => (
              <tr key={i}>
                <td>{c.nome}</td>
                <td>{c.turma}</td>
                <td>{new Date(c.data).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {recentes.length > 0 && (
          <div className="card-footer bg-white border-0">
            <Link to="/admin/certificados" className="btn btn-sm btn-link p-0 text-decoration-none">
              Ver todos os certificados <i className="bi bi-arrow-right" />
            </Link>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
