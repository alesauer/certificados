import io
import csv
from datetime import datetime, timezone
from collections import defaultdict
from flask import Blueprint, request, jsonify, Response
from ..services.supabase_service import get_service_client
from ..services.auth_service import require_auth
from ..services.pdf_service import invalidar_cache

admin_bp = Blueprint("admin", __name__)


# ──────────────────────────────────────────────
# TURMAS
# ──────────────────────────────────────────────

@admin_bp.route("/turmas", methods=["GET"])
@require_auth
def listar_turmas():
    client = get_service_client()
    res = client.table("turmas").select(
        "*, certificados(count)"
    ).order("created_at", desc=True).execute()
    return jsonify(res.data), 200


@admin_bp.route("/turmas", methods=["POST"])
@require_auth
def criar_turma():
    data = request.get_json(force=True)
    payload = {
        "nome": data.get("nome"),
        "descricao": data.get("descricao", ""),
        "ativa": data.get("ativa", False),
        "imagem_url": data.get("imagem_url", ""),
        "nome_pos_x": data.get("nome_pos_x", 148),
        "nome_pos_y": data.get("nome_pos_y", 105),
        "nome_fonte_tam": data.get("nome_fonte_tam", 36),
        "nome_maiusculo": data.get("nome_maiusculo", True),
    }
    if not payload["nome"]:
        return jsonify({"error": "Nome da turma é obrigatório"}), 400

    client = get_service_client()

    # Se criando como ativa, desativa todas as outras
    if payload["ativa"]:
        client.table("turmas").update({"ativa": False}).execute()

    res = client.table("turmas").insert(payload).execute()
    return jsonify(res.data[0]), 201


@admin_bp.route("/turmas/<turma_id>", methods=["PUT"])
@require_auth
def editar_turma(turma_id):
    data = request.get_json(force=True)
    allowed = ["nome", "descricao", "ativa", "imagem_url", "nome_pos_x", "nome_pos_y", "nome_fonte_tam", "nome_maiusculo"]
    payload = {k: v for k, v in data.items() if k in allowed}

    client = get_service_client()

    # Se está ativando esta turma, desativa todas as outras
    if payload.get("ativa") is True:
        client.table("turmas").update({"ativa": False}).neq("id", turma_id).execute()

    res = client.table("turmas").update(payload).eq("id", turma_id).execute()
    return jsonify(res.data[0] if res.data else {}), 200


@admin_bp.route("/turmas/<turma_id>", methods=["DELETE"])
@require_auth
def deletar_turma(turma_id):
    client = get_service_client()
    client.table("turmas").delete().eq("id", turma_id).execute()
    return jsonify({"ok": True}), 200


# ──────────────────────────────────────────────
# UPLOAD DE IMAGEM DE FUNDO
# ──────────────────────────────────────────────

@admin_bp.route("/turmas/<turma_id>/upload-imagem", methods=["POST"])
@require_auth
def upload_imagem(turma_id):
    """Upload da imagem de fundo do CERTIFICADO PDF."""
    if "imagem" not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400

    import os, time
    file = request.files["imagem"]
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else 'jpg'
    # Timestamp garante nome único — evita conflito com arquivo anterior
    filename = f"cert_{turma_id}_{int(time.time())}.{ext}"
    file_bytes = file.read()
    content_type = file.content_type or f"image/{ext}"

    client = get_service_client()

    try:
        client.storage.from_("imagens-fundo").upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": content_type},
        )
    except Exception as e:
        print(f"[upload_imagem] Erro: {e}")
        return jsonify({"error": f"Erro no upload: {str(e)}"}), 500

    url = f"{os.getenv('SUPABASE_URL')}/storage/v1/object/public/imagens-fundo/{filename}"
    # Invalida o cache para que o próximo PDF use a nova imagem
    invalidar_cache(url)
    client.table("turmas").update({"imagem_url": url}).eq("id", turma_id).execute()
    return jsonify({"imagem_url": url}), 200


@admin_bp.route("/turmas/<turma_id>/upload-imagem-pagina", methods=["POST"])
@require_auth
def upload_imagem_pagina(turma_id):
    """Upload da imagem de fundo da PÁGINA PÚBLICA de emissão."""
    if "imagem" not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400

    import os, time
    file = request.files["imagem"]
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else 'jpg'
    filename = f"pagina_{turma_id}_{int(time.time())}.{ext}"
    file_bytes = file.read()
    content_type = file.content_type or f"image/{ext}"

    client = get_service_client()

    try:
        client.storage.from_("imagens-fundo").upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": content_type},
        )
    except Exception as e:
        print(f"[upload_imagem_pagina] Erro: {e}")
        return jsonify({"error": f"Erro no upload: {str(e)}"}), 500

    url = f"{os.getenv('SUPABASE_URL')}/storage/v1/object/public/imagens-fundo/{filename}"
    # Invalida o cache da página pública
    invalidar_cache(url)
    client.table("turmas").update({"pagina_img_url": url}).eq("id", turma_id).execute()
    return jsonify({"pagina_img_url": url}), 200


# ──────────────────────────────────────────────
# CERTIFICADOS
# ──────────────────────────────────────────────

@admin_bp.route("/certificados", methods=["GET"])
@require_auth
def listar_certificados():
    client = get_service_client()
    turma_id = request.args.get("turma_id")
    query = client.table("certificados").select(
        "*, turmas(nome)"
    ).order("data_emissao", desc=True)
    if turma_id:
        query = query.eq("turma_id", turma_id)
    res = query.execute()
    return jsonify(res.data), 200


@admin_bp.route("/certificados/<cert_id>", methods=["DELETE"])
@require_auth
def deletar_certificado(cert_id):
    client = get_service_client()
    client.table("certificados").delete().eq("id", cert_id).execute()
    return jsonify({"ok": True}), 200


@admin_bp.route("/certificados/exportar", methods=["GET"])
@require_auth
def exportar_csv():
    client = get_service_client()
    turma_id = request.args.get("turma_id")
    query = client.table("certificados").select(
        "nome_completo, hash_sha256, data_emissao, turmas(nome)"
    ).order("data_emissao", desc=True)
    if turma_id:
        query = query.eq("turma_id", turma_id)
    res = query.execute()

    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")
    writer.writerow(["Nome Completo", "Turma", "Hash SHA256", "Data de Emissão"])
    for row in res.data:
        writer.writerow([
            row["nome_completo"],
            row.get("turmas", {}).get("nome", ""),
            row["hash_sha256"],
            row["data_emissao"],
        ])

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=certificados.csv"},
    )


# ──────────────────────────────────────────────
# ESTATÍSTICAS
# ──────────────────────────────────────────────

@admin_bp.route("/estatisticas", methods=["GET"])
@require_auth
def estatisticas():
    client = get_service_client()

    # Todos certificados (campos mínimos)
    certs_res = client.table("certificados").select(
        "id, nome_completo, data_emissao, turma_id, turmas(nome)"
    ).order("data_emissao", desc=True).execute()
    certs = certs_res.data

    # Turmas
    turmas_res = client.table("turmas").select("id, nome, ativa").execute()
    turmas = turmas_res.data

    now = datetime.now(timezone.utc)

    # KPIs
    total_geral = len(certs)
    turma_ativa = next((t for t in turmas if t.get("ativa")), None)
    total_turma_ativa = sum(1 for c in certs if c["turma_id"] == turma_ativa["id"]) if turma_ativa else 0
    hoje_str = now.strftime("%Y-%m-%d")
    total_hoje = sum(1 for c in certs if c["data_emissao"][:10] == hoje_str)

    # Emissões por dia (últimos 30 dias) — dict dia -> count
    por_dia: dict = defaultdict(int)
    for c in certs:
        dia = c["data_emissao"][:10]
        if dia >= (now.strftime("%Y-%m-%d")[:8] + "01"):  # rough filter
            por_dia[dia] += 1
    # ordena e pega últimos 30
    por_dia_sorted = sorted(por_dia.items())[-30:]
    grafico_por_dia = [{"data": d, "quantidade": q} for d, q in por_dia_sorted]

    # Emissões por turma
    por_turma: dict = defaultdict(int)
    nome_turma: dict = {}
    for c in certs:
        tid = c["turma_id"]
        por_turma[tid] += 1
        nome_turma[tid] = c.get("turmas", {}).get("nome", "—") if c.get("turmas") else "—"
    grafico_por_turma = [
        {"turma": nome_turma.get(tid, "—"), "quantidade": q}
        for tid, q in sorted(por_turma.items(), key=lambda x: x[1], reverse=True)
    ]

    # Emissões por hora do dia
    por_hora: dict = defaultdict(int)
    for c in certs:
        try:
            hora = int(c["data_emissao"][11:13])
            por_hora[hora] += 1
        except Exception:
            pass
    grafico_por_hora = [{"hora": f"{h:02d}h", "quantidade": por_hora.get(h, 0)} for h in range(24)]

    # Top 10 dias
    todos_dias: dict = defaultdict(int)
    for c in certs:
        todos_dias[c["data_emissao"][:10]] += 1
    top_dias = sorted(todos_dias.items(), key=lambda x: x[1], reverse=True)[:10]
    grafico_top_dias = [{"data": d, "quantidade": q} for d, q in top_dias]

    # Atividade recente (últimos 20)
    recentes = [
        {
            "nome": c["nome_completo"],
            "turma": c.get("turmas", {}).get("nome", "—") if c.get("turmas") else "—",
            "data": c["data_emissao"],
        }
        for c in certs[:20]
    ]

    return jsonify({
        "kpis": {
            "total_geral": total_geral,
            "total_turma_ativa": total_turma_ativa,
            "turma_ativa_nome": turma_ativa["nome"] if turma_ativa else None,
            "total_turmas": len(turmas),
            "total_hoje": total_hoje,
        },
        "grafico_por_dia": grafico_por_dia,
        "grafico_por_turma": grafico_por_turma,
        "grafico_por_hora": grafico_por_hora,
        "grafico_top_dias": grafico_top_dias,
        "recentes": recentes,
    }), 200


# ──────────────────────────────────────────────
# CONFIGURAÇÕES
# ──────────────────────────────────────────────

@admin_bp.route("/configuracoes", methods=["GET"])
@require_auth
def get_configuracoes():
    client = get_service_client()
    defaults = {
        "id": 1,
        "cpf_obrigatorio": False,
        "pagina_titulo": "Emissão de Certificados",
        "pagina_subtitulo": "Preencha os dados abaixo para gerar seu certificado",
        "pagina_cor_fundo": "#0f3460",
        "pagina_img_url": "",
    }
    try:
        res = client.table("configuracoes").select("*").eq("id", 1).execute()
        if res.data:
            return jsonify({**defaults, **res.data[0]}), 200
    except Exception:
        pass
    return jsonify(defaults), 200


@admin_bp.route("/configuracoes", methods=["PUT"])
@require_auth
def salvar_configuracoes():
    data = request.get_json(force=True)
    payload = {
        "id": 1,
        "cpf_obrigatorio": bool(data.get("cpf_obrigatorio", False)),
        "pagina_titulo": data.get("pagina_titulo", "Emissão de Certificados"),
        "pagina_subtitulo": data.get("pagina_subtitulo", "Preencha os dados abaixo para gerar seu certificado"),
        "pagina_cor_fundo": data.get("pagina_cor_fundo", "#0f3460"),
        "pagina_img_url": data.get("pagina_img_url", ""),
    }
    client = get_service_client()
    try:
        res = client.table("configuracoes").upsert(payload).execute()
        return jsonify(res.data[0] if res.data else payload), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/configuracoes/upload-imagem-pagina", methods=["POST"])
@require_auth
def upload_imagem_pagina_config():
    """Upload da imagem de fundo da página pública (configuração global)."""
    if "imagem" not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400
    import os, time
    file = request.files["imagem"]
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else 'jpg'
    filename = f"pagina_config_{int(time.time())}.{ext}"
    file_bytes = file.read()
    content_type = file.content_type or f"image/{ext}"
    client = get_service_client()
    try:
        client.storage.from_("imagens-fundo").upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": content_type},
        )
    except Exception as e:
        return jsonify({"error": f"Erro no upload: {str(e)}"}), 500
    url = f"{os.getenv('SUPABASE_URL')}/storage/v1/object/public/imagens-fundo/{filename}"
    client.table("configuracoes").upsert({"id": 1, "pagina_img_url": url}).execute()
    return jsonify({"pagina_img_url": url}), 200
