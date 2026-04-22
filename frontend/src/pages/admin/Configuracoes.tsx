import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { adminGetConfiguracoes, adminSalvarConfiguracoes } from "../../lib/api";
import { toast } from "react-toastify";

interface Config {
  cpf_obrigatorio: boolean;
}

export default function Configuracoes() {
  const [config, setConfig] = useState<Config>({ cpf_obrigatorio: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminGetConfiguracoes()
      .then(setConfig)
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

                {/* Preview do estado */}
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
              <div className="card-footer bg-white border-0 pb-3">
                <button
                  className="btn btn-primary"
                  onClick={handleSalvar}
                  disabled={saving}
                >
                  {saving ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Salvando...</>
                  ) : (
                    <><i className="bi bi-check-lg me-2" />Salvar configurações</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Painel lateral de info */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm h-100">
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
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
