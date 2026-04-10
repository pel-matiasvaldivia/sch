"""Transcripción de voz a texto con faster-whisper."""
import os
import tempfile
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.dependencies import require_roles

router = APIRouter(prefix="/v1/transcribe", tags=["Transcripción"])

# El modelo se carga una sola vez al primer uso (lazy loading)
# para no bloquear el arranque del servidor
_whisper_model = None


def _get_model():
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel
        model_size = os.getenv("WHISPER_MODEL", "small")
        print(f"⏳ Cargando modelo Whisper '{model_size}' en CPU...")
        _whisper_model = WhisperModel(
            model_size,
            device="cpu",
            compute_type="int8",   # int8 = máximo rendimiento en CPU sin GPU
        )
        print(f"✓ Modelo Whisper '{model_size}' listo")
    return _whisper_model


ALLOWED_EXTENSIONS = {".webm", ".wav", ".mp3", ".ogg", ".mp4", ".m4a"}
MAX_AUDIO_SIZE_MB = 25


class TranscriptionResponse(BaseModel):
    text: str
    language: str
    duration_seconds: float


@router.post("/", response_model=TranscriptionResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    _user=Depends(require_roles("medico", "admin")),
):
    """
    Transcribe un archivo de audio a texto usando Whisper.
    Acepta: webm, wav, mp3, ogg, mp4, m4a. Máximo 25MB.
    """
    # Validar extensión
    filename = audio.filename or ""
    ext = os.path.splitext(filename)[1].lower() if filename else ".webm"
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato no soportado: {ext}. Usar: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Leer el contenido
    content = await audio.read()

    # Validar tamaño
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_AUDIO_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"El archivo supera el límite de {MAX_AUDIO_SIZE_MB}MB",
        )

    # Guardar en archivo temporal y transcribir
    try:
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        model = _get_model()

        segments, info = model.transcribe(
            tmp_path,
            language="es",          # Forzar español para precisión médica
            beam_size=3,            # Balance velocidad/precisión (5 es default)
            vad_filter=True,        # Elimina silencios automáticamente
            vad_parameters={
                "min_silence_duration_ms": 500,
            },
        )

        # Concatenar todos los segmentos
        text = " ".join(seg.text.strip() for seg in segments).strip()

        return TranscriptionResponse(
            text=text,
            language=info.language,
            duration_seconds=round(info.duration, 1),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al transcribir el audio: {str(e)}",
        )
    finally:
        # Limpiar archivo temporal
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
