import io
import time
import requests
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from PIL import Image as PILImage

# ─── Cache de imagens em memória ──────────────────────────────────────────────
# Estrutura: { url: {"data": bytes, "ts": timestamp} }
_image_cache: dict = {}
_CACHE_TTL_SECONDS = 3600  # 1 hora — revalida após trocar a imagem no admin


def _get_imagem(url: str) -> bytes | None:
    """Baixa a imagem uma única vez e mantém em cache por 1 hora."""
    agora = time.time()
    entrada = _image_cache.get(url)
    if entrada and (agora - entrada["ts"]) < _CACHE_TTL_SECONDS:
        return entrada["data"]

    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        _image_cache[url] = {"data": resp.content, "ts": agora}
        print(f"[pdf_service] Imagem cacheada: {url[:60]}... ({len(resp.content)//1024} KB)")
        return resp.content
    except Exception as e:
        print(f"[pdf_service] Erro ao baixar imagem: {e}")
        return None

def invalidar_cache(url: str):
    """Remove a imagem do cache — chamar ao atualizar a imagem de uma turma."""
    if url in _image_cache:
        del _image_cache[url]
        print(f"[pdf_service] Cache invalidado: {url[:60]}...")


def gerar_pdf(
    nome_completo: str,
    imagem_url: str,
    pos_x: float,
    pos_y: float,
    fonte_tamanho: int,
    fonte_cor: tuple = (255, 255, 255),
) -> bytes:
    """
    Gera um PDF A4 paisagem com imagem de fundo e o nome posicionado em pos_x, pos_y (em mm).
    Retorna os bytes do PDF.
    """
    buffer = io.BytesIO()
    page_size = landscape(A4)
    c = canvas.Canvas(buffer, pagesize=page_size)
    page_w, page_h = page_size

    # Imagem de fundo — usa cache para evitar download repetido
    if imagem_url:
        img_bytes = _get_imagem(imagem_url)
        if img_bytes:
            try:
                pil_img = PILImage.open(io.BytesIO(img_bytes)).convert("RGB")
                rgb_buffer = io.BytesIO()
                pil_img.save(rgb_buffer, format="JPEG", quality=90)
                rgb_buffer.seek(0)
                img_reader = ImageReader(rgb_buffer)
                c.drawImage(img_reader, 0, 0, width=page_w, height=page_h)
            except Exception as e:
                print(f"[pdf_service] Erro ao renderizar imagem: {e}")

    # Fonte built-in com suporte a Latin-1 (português: ã, ç, é, ê, ó, etc.)
    font_name = "Helvetica-Bold"

    # Encode para Latin-1 — garante renderização correta de caracteres portugueses
    try:
        nome_pdf = nome_completo.upper().encode("latin-1").decode("latin-1")
    except (UnicodeEncodeError, UnicodeDecodeError):
        nome_pdf = nome_completo.upper().encode("ascii", errors="replace").decode("ascii")

    # Cor do texto (padrão branco para visibilidade em fundos escuros)
    r, g, b = [v / 255.0 for v in fonte_cor]
    c.setFillColorRGB(r, g, b)

    # Sombra suave para garantir legibilidade em qualquer fundo
    c.setStrokeColorRGB(0, 0, 0)
    c.setLineWidth(0.5)

    # Posição: converte mm para pontos (1mm = 2.8346 pts)
    x_pts = pos_x * mm
    y_pts = pos_y * mm

    c.setFont(font_name, fonte_tamanho)

    # Desenha contorno (stroke) e preenchimento (fill)
    c.drawCentredString(x_pts, y_pts, nome_pdf)

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.read()
