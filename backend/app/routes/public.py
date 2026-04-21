import hashlib
from flask import Blueprint, request, jsonify, send_file
import io
from ..services.supabase_service import get_service_client
from ..services.pdf_service import gerar_pdf

public_bp = Blueprint("public", __name__)


def _get_turma_ativa():
    """Retorna a turma ativa. Lança exceção se não houver nenhuma."""
    client = get_service_client()
    res = client.table("turmas").select("*").eq("ativa", True).order("created_at", desc=True).limit(1).execute()
    if not res.data:
        return None
    return res.data[0]


@public_bp.route("/config", methods=["GET"])
def get_config():
    """Retorna configurações da turma ativa para personalizar a página pública."""
    turma = _get_turma_ativa()
    if not turma:
        return jsonify({"error": "Nenhuma turma ativa"}), 404
    return jsonify({
        "pagina_titulo": turma.get("pagina_titulo") or "Emissão de Certificados",
        "pagina_subtitulo": turma.get("pagina_subtitulo") or "Preencha os dados abaixo para gerar seu certificado",
        "pagina_cor_fundo": turma.get("pagina_cor_fundo") or "#0f3460",
        "pagina_img_url": turma.get("pagina_img_url") or "",
    }), 200


@public_bp.route("/certificados/gerar", methods=["POST"])
def gerar_certificado():
    """Valida, gera o PDF e registra o certificado para a turma ativa."""
    data = request.get_json(force=True)
    nome = (data.get("nome_completo") or "").strip()

    if not nome:
        return jsonify({"error": "Nome é obrigatório"}), 400

    turma = _get_turma_ativa()
    if not turma:
        return jsonify({"error": "Nenhuma turma ativa no momento"}), 404

    turma_id = turma["id"]

    # Hash sempre em maiúsculas para consistência
    nome_upper = nome.upper()
    hash_valor = hashlib.sha256(f"{turma_id}:{nome_upper}".encode()).hexdigest()

    client = get_service_client()

    # Verifica duplicata
    dup = client.table("certificados").select("id").eq("hash_sha256", hash_valor).execute()
    if dup.data:
        return jsonify({"error": "Certificado já emitido para este nome nesta turma"}), 409

    # Aplica capitalização conforme configuração da turma
    nome_maiusculo = turma.get("nome_maiusculo", True)
    nome_final = nome.upper() if nome_maiusculo else nome

    # Gera o PDF
    try:
        pdf_bytes = gerar_pdf(
            nome_completo=nome_final,
            imagem_url=turma.get("imagem_url", ""),
            pos_x=turma.get("nome_pos_x", 148),
            pos_y=turma.get("nome_pos_y", 105),
            fonte_tamanho=turma.get("nome_fonte_tam", 36),
        )
    except Exception as e:
        return jsonify({"error": f"Erro ao gerar PDF: {str(e)}"}), 500

    # Registra no banco
    client.table("certificados").insert({
        "turma_id": turma_id,
        "nome_completo": nome_final,
        "hash_sha256": hash_valor,
    }).execute()

    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"certificado_{nome_final.replace(' ', '_')}.pdf",
    )

