import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Turmas from "./pages/admin/Turmas";
import TurmaDetalhe from "./pages/admin/TurmaDetalhe";
import Certificados from "./pages/admin/Certificados";
import Estatisticas from "./pages/admin/Estatisticas";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Área pública */}
        <Route path="/" element={<Home />} />

        {/* Admin login */}
        <Route path="/admin/login" element={<Login />} />

        {/* Admin protegido */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/turmas"
          element={
            <ProtectedRoute>
              <Turmas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/turmas/:id"
          element={
            <ProtectedRoute>
              <TurmaDetalhe />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/certificados"
          element={
            <ProtectedRoute>
              <Certificados />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/estatisticas"
          element={
            <ProtectedRoute>
              <Estatisticas />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
