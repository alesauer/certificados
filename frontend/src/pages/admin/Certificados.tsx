import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import {
  adminGetCertificados,
  adminDeletarCertificado,
  adminExportarCSV,
  adminGetTurmas,
} from "../../lib/api";
import { toast } from "react-toastify";

interface Cert {
  id: string;
  nome_completo: string;
  hash_sha256: string;
  data_emissao: string;
  turmas?: { nome: string };
}

interface Turma {
  id: string;
  nome: string;
}

export default function Certificados() {
  const [certs, setCerts] = useState<Cert[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [filtroTurma, setFiltroTurma] = useState("");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [exportando, setExportando] = useState(false);
  const POR_PAGINA = 15;

  async function handleExportarCSV() {
    setExportando(true);
    try {
      const blob = await adminExportarCSV(filtroTurma || undefined);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "certificados.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao exportar CSV");
    } finally {
      setExportando(false);
    }
  }

  async function load() {
    try {
      const [data, ts] = await Promise.all([
        adminGetCertificados(filtroTurma || undefined),
        adminGetTurmas(),
      ]);
      setCerts(data);
      setTurmas(ts);
      setPagina(1);
    } catch {
      toast.error("Erro ao carregar certificados");
    }
  }

  useEffect(() => { load(); }, [filtroTurma]);

  async function handleDelete(c: Cert) {
    if (!confirm(`Revogar certificado de "${c.nome_completo}"?`)) return;
    try {
      await adminDeletarCertificado(c.id);
      toast.success("Certificado revogado");
      load();
    } catch {
      toast.error("Erro ao revogar");
    }
  }

  const filtered = certs.filter((c) =>
    c.nome_completo.toLowerCase().includes(busca.toLowerCase())
  );

  const totalPaginas = Math.ceil(filtered.length / POR_PAGINA);
  const paginated = filtered.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Todos os Certificados</h4>
        <button
          className="btn btn-sm btn-outline-success"
          onClick={handleExportarCSV}
          disabled={exportando}
        >
          {exportando ? (
            <><span className="spinner-border spinner-border-sm me-1" />Exportando...</>
          ) : (
            <><i className="bi bi-download me-2" />Exportar CSV</>
          )}
        </button>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-md-4">
          <select
            className="form-select"
            value={filtroTurma}
            onChange={(e) => setFiltroTurma(e.target.value)}
          >
            <option value="">Todas as turmas</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-8">
          <input
            className="form-control"
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
          />
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Nome Completo</th>
              <th>Turma</th>
              <th>Hash (parcial)</th>
              <th>Data de Emissão</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted py-5">
                  Nenhum certificado encontrado
                </td>
              </tr>
            )}
            {paginated.map((c) => (
              <tr key={c.id}>
                <td className="fw-semibold">{c.nome_completo}</td>
                <td>{c.turmas?.nome ?? "—"}</td>
                <td>
                  <span className="text-muted small font-monospace" title={c.hash_sha256}>
                    {c.hash_sha256.slice(0, 16)}...
                  </span>
                </td>
                <td>{new Date(c.data_emissao).toLocaleString("pt-BR")}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(c)}
                  >
                    <i className="bi bi-x-circle me-1" />
                    Revogar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <nav className="mt-3 d-flex justify-content-center">
          <ul className="pagination">
            <li className={`page-item ${pagina === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setPagina(pagina - 1)}>
                &laquo;
              </button>
            </li>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
              <li key={p} className={`page-item ${p === pagina ? "active" : ""}`}>
                <button className="page-link" onClick={() => setPagina(p)}>
                  {p}
                </button>
              </li>
            ))}
            <li className={`page-item ${pagina === totalPaginas ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setPagina(pagina + 1)}>
                &raquo;
              </button>
            </li>
          </ul>
        </nav>
      )}

      <p className="text-muted small text-end mt-1">
        {filtered.length} certificado(s) encontrado(s)
      </p>
    </AdminLayout>
  );
}
