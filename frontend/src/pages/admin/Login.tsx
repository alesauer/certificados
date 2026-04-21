import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-toastify";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("E-mail ou senha inválidos");
    } else {
      navigate("/admin");
    }
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)" }}
    >
      <div className="card shadow p-4" style={{ maxWidth: 380, width: "100%", borderRadius: 16 }}>
        <div className="text-center mb-4">
          <img src="/simplifica.png" alt="Simplifica Treinamentos" style={{ height: 80, objectFit: "contain" }} className="mb-3" />
          <h6 className="fw-bold text-muted">Área Administrativa</h6>
        </div>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">E-mail</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="mb-4">
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button className="btn btn-primary w-100" type="submit" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm" /> : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
