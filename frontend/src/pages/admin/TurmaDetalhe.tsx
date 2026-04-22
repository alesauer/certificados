import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { adminGetCertificados, adminDeletarCertificado, adminExportarCSV, adminGetTurmas } from "../../lib/api";
import { toast } from "react-toastify";

interface Cert {
  id: string;
  nome_completo: string;
  hash_sha256: string;
  data_emissao: string;
}

export default function TurmaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const [certs, setCerts] = useState<Cert[]>([]);
  const [nomeTurma, setNomeTurma] = useState("");
  const [busca, setBusca] = useState("");
  const [exportando, setExportando] = useState(false);

  async function handleExportarCSV() {
    setExportando(true);
    try {
      const blob = await adminExportarCSV(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificados_${nomeTurma || id}.csv`;
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
      const [data, turmas] = await Promise.all([
        adminGetCertificados(id),
        adminGetTurmas(),
      ]);
      setCerts(data);
      const t = turmas.find((x: { id: string; nome: string }) => x.id === id);
      if (t) setNomeTurma(t.nome);
    } catch {
      toast.error("Erro ao carregar dados");
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleDelete(cert: Cert) {
    if (!confirm(`Revogar certificado de "${cert.nome_completo}"?`)) return;
    try {
      await adminDeletarCertificado(cert.id);
      toast.success("Certificado revogado");
      load();
    } catch {
      toast.error("Erro ao revogar certificado");
    }
  }

  const filtered = certs.filter((c) =>
    c.nome_completo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="d-flex align-items-center gap-3 mb-4">
        <Link to="/admin/turmas" className="btn btn-sm btn-outline-secondary">
          <i className="bi bi-arrow-left" />
        </Link>
        <h4 className="fw-bold mb-0">Certificados — {nomeTurma}</h4>
        <button
          className="btn btn-sm btn-outline-success ms-auto"
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

      <div className="mb-3">
        <input
          className="form-control"
          placeholder="Buscar por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="card border-0 shadow-sm">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Nome Completo</th>
              <th>Hash SHA-256</th>
              <th>Data de Emissão</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-muted py-5">
                  Nenhum certificado encontrado
                </td>
              </tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="fw-semibold">{c.nome_completo}</td>
                <td>
                  <span
                    className="text-muted small font-monospace"
                    title={c.hash_sha256}
                  >
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
    </AdminLayout>
  );
}
