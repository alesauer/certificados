import { ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  const navItems = [
    { to: "/admin", icon: "bi-speedometer2", label: "Dashboard" },
    { to: "/admin/turmas", icon: "bi-collection", label: "Turmas" },
    { to: "/admin/certificados", icon: "bi-award", label: "Certificados" },
    { to: "/admin/estatisticas", icon: "bi-bar-chart-line", label: "Estatísticas" },
  ];

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <nav
        className="d-flex flex-column p-3 bg-dark text-white"
        style={{ width: 220, minHeight: "100vh" }}
      >
        <div className="mb-4 fw-bold fs-5">
          <i className="bi bi-patch-check me-2" />
          Certificados
        </div>
        <ul className="nav nav-pills flex-column gap-1 flex-grow-1">
          {navItems.map((item) => (
            <li key={item.to} className="nav-item">
              <Link
                to={item.to}
                className={`nav-link text-white ${
                  pathname === item.to ? "active bg-primary" : ""
                }`}
              >
                <i className={`bi ${item.icon} me-2`} />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <button
          className="btn btn-outline-light btn-sm mt-auto"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right me-2" />
          Sair
        </button>
      </nav>

      {/* Conteúdo */}
      <main className="flex-grow-1 p-4 bg-light">{children}</main>
    </div>
  );
}
