import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL ?? "";

async function authHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

// ─── Público ───────────────────────────────────────────────
export async function getConfigPublica() {
  const res = await fetch(`${API_URL}/api/config`);
  if (!res.ok) throw new Error("Nenhuma turma ativa no momento");
  return res.json();
}

export async function gerarCertificado(nome_completo: string, cpf?: string) {
  const res = await fetch(`${API_URL}/api/certificados/gerar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome_completo, cpf }),
  });
  if (res.status === 409) {
    const err = await res.json();
    throw new Error(err.error);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Erro ao gerar certificado");
  }
  return res.blob();
}

// ─── Admin — Turmas ────────────────────────────────────────
export async function adminGetTurmas() {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/admin/turmas`, { headers });
  if (!res.ok) throw new Error("Erro ao buscar turmas");
  return res.json();
}

export async function adminCriarTurma(data: object) {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/admin/turmas`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao criar turma");
  return res.json();
}

export async function adminEditarTurma(id: string, data: object) {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/admin/turmas/${id}`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao editar turma");
  return res.json();
}

export async function adminDeletarTurma(id: string) {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/admin/turmas/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error("Erro ao deletar turma");
}

export async function adminUploadImagem(turmaId: string, file: File) {
  const headers = await authHeaders();
  const form = new FormData();
  form.append("imagem", file);
  const res = await fetch(`${API_URL}/api/admin/turmas/${turmaId}/upload-imagem`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Erro ao fazer upload da imagem");
  }
  return res.json();
}

// ─── Admin — Certificados ──────────────────────────────────
export async function adminGetCertificados(turmaId?: string) {
  const headers = await authHeaders();
  const params = turmaId ? `?turma_id=${turmaId}` : "";
  const res = await fetch(`${API_URL}/api/admin/certificados${params}`, { headers });
  if (!res.ok) throw new Error("Erro ao buscar certificados");
  return res.json();
}

export async function adminDeletarCertificado(id: string) {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/admin/certificados/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error("Erro ao deletar certificado");
}

export async function adminExportarCSV(turmaId?: string) {
  const headers = await authHeaders();
  const params = turmaId ? `?turma_id=${turmaId}` : "";
  const res = await fetch(`${API_URL}/api/admin/certificados/exportar${params}`, { headers });
  if (!res.ok) throw new Error("Erro ao exportar CSV");
  return res.blob();
}

// ─── Admin — Estatísticas ──────────────────────────────────
export async function adminGetEstatisticas() {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/admin/estatisticas`, { headers });
  if (!res.ok) throw new Error("Erro ao buscar estatísticas");
  return res.json();
}

// ─── Admin — Configurações ─────────────────────────────────
export async function adminGetConfiguracoes() {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/admin/configuracoes`, { headers });
  if (!res.ok) throw new Error("Erro ao buscar configurações");
  return res.json();
}

export async function adminSalvarConfiguracoes(data: object) {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/admin/configuracoes`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao salvar configurações");
  return res.json();
}

export async function adminUploadImagemConfiguracoes(file: File) {
  const headers = await authHeaders();
  const form = new FormData();
  form.append("imagem", file);
  const res = await fetch(`${API_URL}/api/admin/configuracoes/upload-imagem-pagina`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Erro ao fazer upload da imagem");
  }
  return res.json();
}
