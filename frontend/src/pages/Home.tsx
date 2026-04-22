import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getConfigPublica, gerarCertificado } from "../lib/api";

interface Config {
  pagina_titulo: string;
  pagina_subtitulo: string;
  pagina_cor_fundo: string;
  pagina_img_url: string;
  cpf_obrigatorio: boolean;
}

// Valida nome composto: mínimo 2 palavras, só letras/acentos/espaços/hífens
function validarNome(nome: string): string | null {
  const trimmed = nome.trim();
  if (/[0-9]/.test(trimmed)) return "O nome não pode conter números.";
  if (/[^a-zA-ZÀ-ÿ\s'-]/.test(trimmed)) return "O nome não pode conter caracteres especiais.";
  const palavras = trimmed.split(/\s+/).filter(Boolean);
  if (palavras.length < 2) return "Por favor, informe o nome completo (nome e sobrenome).";
  return null;
}

// Formata CPF: 000.000.000-00
function formatarCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function validarCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(d[10]);
}

export default function Home() {
  const [config, setConfig] = useState<Config>({
    pagina_titulo: "Emissão de Certificados",
    pagina_subtitulo: "Preencha os dados abaixo para gerar seu certificado",
    pagina_cor_fundo: "#0f3460",
    pagina_img_url: "",
    cpf_obrigatorio: false,
  });
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [nomeErro, setNomeErro] = useState("");
  const [cpfErro, setCpfErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [semTurma, setSemTurma] = useState(false);

  useEffect(() => {
    getConfigPublica()
      .then(setConfig)
      .catch(() => setSemTurma(true));
  }, []);

  function handleNomeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNome(e.target.value);
    if (nomeErro) setNomeErro("");
  }

  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCpf(formatarCPF(e.target.value));
    if (cpfErro) setCpfErro("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Valida nome
    const erroNome = validarNome(nome);
    if (erroNome) {
      setNomeErro(erroNome);
      return;
    }

    // Valida CPF se obrigatório
    if (config.cpf_obrigatorio) {
      if (!validarCPF(cpf)) {
        setCpfErro("CPF inválido. Verifique e tente novamente.");
        return;
      }
    }

    setLoading(true);
    try {
      const blob = await gerarCertificado(nome.trim(), config.cpf_obrigatorio ? cpf : undefined);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificado_${nome.trim().replace(/\s+/g, "_").toUpperCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Certificado gerado e baixado com sucesso!");
      setNome("");
      setCpf("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar certificado";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const backgroundStyle = config.pagina_img_url
    ? {
        backgroundImage: `url(${config.pagina_img_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : { background: config.pagina_cor_fundo };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={backgroundStyle}
    >
      {config.pagina_img_url && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 0,
          }}
        />
      )}

      <div
        className="card shadow-lg p-4 position-relative"
        style={{ maxWidth: 460, width: "100%", borderRadius: 16, zIndex: 1 }}
      >
        {semTurma ? (
          <div className="text-center py-4">
            <i className="bi bi-exclamation-circle text-warning" style={{ fontSize: 48 }} />
            <h5 className="mt-3">Nenhuma turma ativa no momento</h5>
            <p className="text-muted">Entre em contato com o organizador.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <img src="/simplifica.png" alt="Simplifica Treinamentos" style={{ height: 80, objectFit: "contain" }} className="mb-3" />
              <h4 className="fw-bold">{config.pagina_titulo}</h4>
              <p className="text-muted small">{config.pagina_subtitulo}</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label fw-semibold">Nome Completo</label>
                <input
                  type="text"
                  className={`form-control form-control-lg ${nomeErro ? "is-invalid" : ""}`}
                  placeholder="Digite seu nome e sobrenome"
                  value={nome}
                  onChange={handleNomeChange}
                  required
                />
                {nomeErro && <div className="invalid-feedback">{nomeErro}</div>}
              </div>

              {config.cpf_obrigatorio && (
                <div className="mb-3">
                  <label className="form-label fw-semibold">CPF</label>
                  <input
                    type="text"
                    className={`form-control form-control-lg ${cpfErro ? "is-invalid" : ""}`}
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={handleCpfChange}
                    inputMode="numeric"
                    maxLength={14}
                    required
                  />
                  {cpfErro && <div className="invalid-feedback">{cpfErro}</div>}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-100 btn-lg mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-download me-2" />
                    Gerar e Baixar Certificado
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
