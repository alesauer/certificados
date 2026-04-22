import { useEffect, useRef, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { adminGetConfiguracoes, adminSalvarConfiguracoes, adminUploadImagemConfiguracoes } from "../../lib/api";
import { toast } from "react-toastify";

interface Config {
  cpf_obrigatorio: boolean;
  pagina_titulo: string;
  pagina_subtitulo: string;
  pagina_cor_fundo: string;
  pagina_img_url: string;
}

const defaultConfig: Config = {
  cpf_obrigatorio: false,
  pagina_titulo: "Emissão de Certificados",
  pagina_subtitulo: "Preencha os dados abaixo para gerar seu certificado",
  pagina_cor_fundo: "#0f3460",
  pagina_img_url: "",
};

export default function Configuracoes() {
  const [config, setConfig] = useState<Config>({ ...defaultConfig });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    adminGetConfiguracoes()
      .then((d) => setConfig({ ...defaultConfig, ...d }))
      .catch(() => toast.error("Erro ao carregar configurações"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSalvar() {
    setSaving(true);
    try {
      await adminSalvarConfiguracoes(config);
      toast.success("Configurações salvas com sucesso!");
    } catch {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadImagem(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Apenas imagens são permitidas"); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 20 MB)"); return; }
    setUploadingImg(true);
    try {
      const res = await adminUploadImagemConfiguracoes(file);
      setConfig((c) => ({ ...c, pagina_img_url: res.pagina_img_url }));
      toast.success("Imagem de fundo atualizada");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setUploadingImg(false);
    }
  }

  return (
    <AdminLayout>
      <h4 className="fw-bold mb-4">
        <i className="bi bi-gear-fill me-2 text-primary" />
        Configurações
      </h4>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      ) : (
        <div className="row g-4">
          {/* Bloco: Emissão de Certificados */}
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 pt-3 pb-0">
                <h6 className="fw-bold mb-0">
                  <i className="bi bi-award me-2 text-primary" />
                  Emissão de Certificados
                </h6>
                <p className="text-muted small mt-1 mb-0">
                  Defina quais campos serão exigidos na página pública de emissão.
                </p>
              </div>
              <div className="card-body pt-3">

                {/* Toggle CPF */}
                <div className="d-flex align-items-start justify-content-between p-3 rounded-3"
                  style={{ background: "#f8f9fa" }}>
                  <div>
                    <div className="fw-semibold">Exigir CPF para emitir certificado</div>
                    <div className="text-muted small mt-1">
                      Quando ativado, o usuário deverá informar nome completo e CPF válido.
                      O CPF é enviado apenas para validação e não é armazenado.
                    </div>
                  </div>
                  <div className="ms-4 flex-shrink-0">
                    <div className="form-check form-switch" style={{ transform: "scale(1.4)", transformOrigin: "right center" }}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="switchCpf"
                        checked={config.cpf_obrigatorio}
                        onChange={(e) => setConfig({ ...config, cpf_obrigatorio: e.target.checked })}
                      />
                    </div>
                  </div>
                </div>

                {/* Preview do formulário */}
                <div className="mt-3 p-3 rounded-3 border">
                  <div className="text-muted small fw-semibold mb-2">
                    <i className="bi bi-eye me-1" />
                    Prévia do formulário público:
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold mb-1">Nome Completo</label>
                    <input className="form-control form-control-sm" disabled placeholder="Digite seu nome e sobrenome" />
                  </div>
                  {config.cpf_obrigatorio && (
                    <div className="mb-0">
                      <label className="form-label small fw-semibold mb-1">
                        CPF
                        <span className="badge bg-primary ms-2" style={{ fontSize: 10 }}>Habilitado</span>
                      </label>
                      <input className="form-control form-control-sm" disabled placeholder="000.000.000-00" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bloco: Personalização da Página Pública */}
            <div className="card border-0 shadow-sm mt-4">
              <div className="card-header bg-white border-0 pt-3 pb-0">
                <h6 className="fw-bold mb-0">
                  <i className="bi bi-palette me-2 text-primary" />
                  Página Pública de Emissão
                </h6>
                <p className="text-muted small mt-1 mb-0">
                  Aparência da tela que o participante acessa para gerar o certificado.
                </p>
              </div>
              <div className="card-body pt-3">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Título da página</label>
                    <input
                      className="form-control"
                      value={config.pagina_titulo}
                      onChange={(e) => setConfig({ ...config, pagina_titulo: e.target.value })}
                      placeholder="ex: Emissão de Certificados"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Subtítulo / Instrução</label>
                    <input
                      className="form-control"
                      value={config.pagina_subtitulo}
                      onChange={(e) => setConfig({ ...config, pagina_subtitulo: e.target.value })}
                      placeholder="ex: Preencha os dados abaixo para gerar seu certificado"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Cor de fundo</label>
                    <div className="input-group">
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={config.pagina_cor_fundo}
                        onChange={(e) => setConfig({ ...config, pagina_cor_fundo: e.target.value })}
                        title="Cor de fundo da página"
                      />
                      <input
                        type="text"
                        className="form-control"
                        value={config.pagina_cor_fundo}
                        onChange={(e) => setConfig({ ...config, pagina_cor_fundo: e.target.value })}
                      />
                    </div>
                    <small className="text-muted">Usada quando não há imagem de fundo</small>
                  </div>

                  <div className="col-md-8">
                    <label className="form-label">Imagem de fundo da página</label>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {config.pagina_img_url && (
                        <img
                          src={config.pagina_img_url}
                          alt="fundo"
                          style={{ height: 48, borderRadius: 6, objectFit: "cover" }}
                        />
                      )}
                      <label className="btn btn-outline-secondary btn-sm">
                        <i className="bi bi-upload me-1" />
                        {config.pagina_img_url ? "Trocar imagem" : "Upload imagem de fundo"}
                        {uploadingImg && <span className="spinner-border spinner-border-sm ms-1" />}
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadImagem(f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {config.pagina_img_url && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setConfig({ ...config, pagina_img_url: "" })}
                          title="Remover imagem"
                        >
                          <i className="bi bi-x" /> Remover
                        </button>
                      )}
                    </div>
                    <small className="text-muted">Quando definida, substitui a cor de fundo</small>
                  </div>

                  {/* Preview da página */}
                  <div className="col-12">
                    <label className="form-label">Preview da página</label>
                    <div
                      className="rounded position-relative d-flex align-items-center justify-content-center"
                      style={{
                        height: 160,
                        background: config.pagina_img_url
                          ? `url(${config.pagina_img_url}) center/cover`
                          : config.pagina_cor_fundo,
                        borderRadius: 10,
                        overflow: "hidden",
                      }}
                    >
                      {config.pagina_img_url && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
                      )}
                      <div
                        className="card p-3 text-center position-relative"
                        style={{ maxWidth: 240, borderRadius: 10, zIndex: 1 }}
                      >
                        <i className="bi bi-patch-check-fill text-primary" style={{ fontSize: 28 }} />
                        <div className="fw-bold small mt-1">{config.pagina_titulo || "Título"}</div>
                        <div className="text-muted" style={{ fontSize: 10 }}>{config.pagina_subtitulo || "Subtítulo"}</div>
                        <div className="mt-2 bg-light rounded" style={{ height: 20, opacity: 0.7, fontSize: 9 }}>
                          Campo de nome...
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botão salvar global */}
            <div className="mt-3">
              <button className="btn btn-primary" onClick={handleSalvar} disabled={saving}>
                {saving ? (
                  <><span className="spinner-border spinner-border-sm me-2" />Salvando...</>
                ) : (
                  <><i className="bi bi-check-lg me-2" />Salvar configurações</>
                )}
              </button>
            </div>
          </div>

          {/* Painel lateral de info */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-info-circle me-2 text-info" />
                  Informações
                </h6>
                <ul className="list-unstyled small text-muted">
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-success me-2" />
                    O <b>Nome Completo</b> sempre exige nome e sobrenome.
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-success me-2" />
                    Números e caracteres especiais no nome são bloqueados automaticamente.
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-success me-2" />
                    O <b>CPF</b> é validado com algoritmo oficial (dígitos verificadores).
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-shield-check text-primary me-2" />
                    O CPF não é armazenado no banco — usado apenas para liberar a emissão.
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-palette text-primary me-2" />
                    A <b>personalização da página</b> é global — aplica-se a todas as turmas.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

