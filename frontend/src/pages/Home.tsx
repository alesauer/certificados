import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getConfigPublica, gerarCertificado } from "../lib/api";

interface Config {
  pagina_titulo: string;
  pagina_subtitulo: string;
  pagina_cor_fundo: string;
  pagina_img_url: string;
}

export default function Home() {
  const [config, setConfig] = useState<Config>({
    pagina_titulo: "Emissão de Certificados",
    pagina_subtitulo: "Preencha os dados abaixo para gerar seu certificado",
    pagina_cor_fundo: "#0f3460",
    pagina_img_url: "",
  });
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [semTurma, setSemTurma] = useState(false);

  useEffect(() => {
    getConfigPublica()
      .then(setConfig)
      .catch(() => setSemTurma(true));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const blob = await gerarCertificado(nome);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificado_${nome.replace(/\s+/g, "_").toUpperCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Certificado gerado e baixado com sucesso!");
      setNome("");
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
      {/* Overlay escuro sutil quando há imagem de fundo */}
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

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label fw-semibold">Nome Completo</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Digite seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  minLength={3}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100 btn-lg"
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
