import { useEffect, useRef, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import {
  adminGetTurmas,
  adminCriarTurma,
  adminEditarTurma,
  adminDeletarTurma,
  adminUploadImagem,
} from "../../lib/api";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

interface Turma {
  id: string;
  nome: string;
  descricao: string;
  ativa: boolean;
  imagem_url: string;
  nome_pos_x: number;
  nome_pos_y: number;
  nome_fonte_tam: number;
  nome_maiusculo: boolean;
  certificados?: { count: number }[];
}

const EMPTY: Omit<Turma, "id" | "certificados"> = {
  nome: "",
  descricao: "",
  ativa: false,
  imagem_url: "",
  nome_pos_x: 148,
  nome_pos_y: 105,
  nome_fonte_tam: 36,
  nome_maiusculo: true,
};

export default function Turmas() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Turma | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const data = await adminGetTurmas();
      setTurmas(data);
    } catch {
      toast.error("Erro ao carregar turmas");
    }
  }

  useEffect(() => { load(); }, []);

  function openNova() {
    setEditando(null);
    setForm({ ...EMPTY });
    setShowModal(true);
  }

  function openEditar(t: Turma) {
    setEditando(t);
    setForm({
      nome: t.nome,
      descricao: t.descricao,
      ativa: t.ativa,
      imagem_url: t.imagem_url,
      nome_pos_x: t.nome_pos_x,
      nome_pos_y: t.nome_pos_y,
      nome_fonte_tam: t.nome_fonte_tam,
      nome_maiusculo: t.nome_maiusculo,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.nome.trim()) { toast.warning("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      if (editando) {
        await adminEditarTurma(editando.id, form);
        toast.success("Turma atualizada");
      } else {
        await adminCriarTurma(form);
        toast.success("Turma criada");
      }
      setShowModal(false);
      load();
    } catch {
      toast.error("Erro ao salvar turma");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtiva(t: Turma) {
    if (!t.ativa) {
      const outrasAtivas = turmas.filter((x) => x.ativa && x.id !== t.id);
      if (outrasAtivas.length > 0) {
        if (!confirm(`Ativar "${t.nome}" irá desativar automaticamente "${outrasAtivas[0].nome}". Continuar?`)) return;
      }
    }
    try {
      await adminEditarTurma(t.id, { ativa: !t.ativa });
      toast.success(`Turma ${!t.ativa ? "ativada" : "desativada"}`);
      load();
    } catch {
      toast.error("Erro ao alterar status");
    }
  }

  async function handleDeletar(t: Turma) {
    if (!confirm(`Deletar turma "${t.nome}" e todos os certificados vinculados?`)) return;
    try {
      await adminDeletarTurma(t.id);
      toast.success("Turma deletada");
      load();
    } catch {
      toast.error("Erro ao deletar turma");
    }
  }

  const MAX_FILE_SIZE_MB = 20;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  function validarArquivo(file: File): string | null {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). O tamanho máximo permitido é ${MAX_FILE_SIZE_MB} MB.`;
    }
    if (!file.type.startsWith("image/")) {
      return "Apenas arquivos de imagem são permitidos (JPG, PNG, WEBP, etc.).";
    }
    return null;
  }

  async function handleUpload(turmaId: string, file: File) {
    const erro = validarArquivo(file);
    if (erro) { toast.error(erro); return; }
    setUploadingId(turmaId);
    try {
      await adminUploadImagem(turmaId, file);
      toast.success("Imagem do certificado atualizada");
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao fazer upload");
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Turmas</h4>
        <button className="btn btn-primary" onClick={openNova}>
          <i className="bi bi-plus-lg me-2" />
          Nova Turma
        </button>
      </div>

      <div className="card border-0 shadow-sm">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Certificados</th>
              <th>Status</th>
              <th>Imagem</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {turmas.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted py-5">
                  Nenhuma turma cadastrada
                </td>
              </tr>
            )}
            {turmas.map((t) => (
              <tr key={t.id}>
                <td className="fw-semibold">{t.nome}</td>
                <td className="text-muted small">{t.descricao || "—"}</td>
                <td>
                  <Link to={`/admin/turmas/${t.id}`} className="badge bg-info text-decoration-none">
                    {t.certificados?.[0]?.count ?? 0} cert.
                  </Link>
                </td>
                <td>
                  <span
                    className={`badge ${t.ativa ? "bg-success" : "bg-secondary"} cursor-pointer`}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleToggleAtiva(t)}
                    title={t.ativa ? "Ativa — está sendo exibida no site. Clique para desativar" : "Clique para ativar como turma pública"}
                  >
                    {t.ativa ? "🟢 Ativa (pública)" : "Inativa"}
                  </span>
                </td>
                <td>
                  {t.imagem_url ? (
                    <img
                      src={t.imagem_url}
                      alt="fundo"
                      style={{ height: 36, borderRadius: 4, objectFit: "cover" }}
                    />
                  ) : (
                    <span className="text-muted small">Sem imagem</span>
                  )}
                  <label className="btn btn-sm btn-outline-secondary ms-2" title="Upload imagem">
                    <i className="bi bi-upload" />
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      ref={fileRef}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(t.id, f);
                        e.target.value = "";
                      }}
                      onClick={() => {}}
                    />
                    {uploadingId === t.id && (
                      <span className="spinner-border spinner-border-sm ms-1" />
                    )}
                  </label>
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={() => openEditar(t)}
                  >
                    <i className="bi bi-pencil" />
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDeletar(t)}
                  >
                    <i className="bi bi-trash" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editando ? "Editar Turma" : "Nova Turma"}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label">Nome *</label>
                    <input
                      className="form-control"
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Status público</label>
                    <select
                      className="form-select"
                      value={form.ativa ? "1" : "0"}
                      onChange={(e) => setForm({ ...form, ativa: e.target.value === "1" })}
                    >
                      <option value="1">🟢 Ativa (visível no site)</option>
                      <option value="0">Inativa (oculta do site)</option>
                    </select>
                    <small className="text-muted">Apenas uma turma pode estar ativa por vez</small>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Descrição</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={form.descricao}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    />
                  </div>

                  <div className="col-12">
                    <hr />
                    <h6 className="fw-semibold">
                      <i className="bi bi-fonts me-2" />
                      Posição e Estilo do Nome no Certificado (PDF A4 paisagem: 297×210mm)
                    </h6>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Posição X (mm)</label>
                    <input
                      type="number"
                      className="form-control"
                      min={0}
                      max={297}
                      value={form.nome_pos_x}
                      onChange={(e) => setForm({ ...form, nome_pos_x: Number(e.target.value) })}
                    />
                    <small className="text-muted">Centro horizontal = 148</small>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Posição Y (mm)</label>
                    <input
                      type="number"
                      className="form-control"
                      min={0}
                      max={210}
                      value={form.nome_pos_y}
                      onChange={(e) => setForm({ ...form, nome_pos_y: Number(e.target.value) })}
                    />
                    <small className="text-muted">Centro vertical = 105</small>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Tamanho da fonte (pt)</label>
                    <input
                      type="number"
                      className="form-control"
                      min={8}
                      max={120}
                      value={form.nome_fonte_tam}
                      onChange={(e) => setForm({ ...form, nome_fonte_tam: Number(e.target.value) })}
                    />
                    <small className="text-muted">Recomendado: 28–48pt</small>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Capitalização do nome</label>
                    <div className="d-flex gap-3 mt-1">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="maiusculo_sim"
                          name="nome_maiusculo"
                          checked={form.nome_maiusculo}
                          onChange={() => setForm({ ...form, nome_maiusculo: true })}
                        />
                        <label className="form-check-label" htmlFor="maiusculo_sim">
                          <span className="badge bg-secondary me-1">TUDO MAIÚSCULO</span>
                          <small className="text-muted d-block">ex: JOÃO DA SILVA</small>
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="maiusculo_nao"
                          name="nome_maiusculo"
                          checked={!form.nome_maiusculo}
                          onChange={() => setForm({ ...form, nome_maiusculo: false })}
                        />
                        <label className="form-check-label" htmlFor="maiusculo_nao">
                          <span className="badge bg-light text-dark border me-1">Como digitado</span>
                          <small className="text-muted d-block">ex: João da Silva</small>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Preview visual da posição */}
                  <div className="col-12">
                    <label className="form-label">Preview da posição</label>
                    <div
                      className="border rounded position-relative bg-secondary bg-opacity-10"
                      style={{ width: "100%", paddingTop: "70.7%" }}
                    >
                      {form.imagem_url && (
                        <img
                          src={form.imagem_url}
                          alt="preview"
                          style={{
                            position: "absolute", top: 0, left: 0,
                            width: "100%", height: "100%", objectFit: "cover", borderRadius: 4,
                          }}
                        />
                      )}
                      <span
                        className="position-absolute fw-bold text-danger"
                        style={{
                          left: `${(form.nome_pos_x / 297) * 100}%`,
                          bottom: `${(form.nome_pos_y / 210) * 100}%`,
                          transform: "translate(-50%, 50%)",
                          fontSize: Math.max(8, form.nome_fonte_tam * 0.35),
                          whiteSpace: "nowrap",
                          textShadow: "0 0 4px #fff",
                        }}
                      >
                        {form.nome_maiusculo ? "NOME DO PARTICIPANTE" : "Nome do Participante"}
                      </span>
                    </div>
                    <small className="text-muted">
                      Posição X={form.nome_pos_x}mm / Y={form.nome_pos_y}mm — origem inferior-esquerda
                    </small>
                  </div>


                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm" /> : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
