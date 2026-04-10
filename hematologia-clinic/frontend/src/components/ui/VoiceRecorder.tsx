"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

type RecordingState = "idle" | "recording" | "transcribing";

export function VoiceRecorder({ onTranscript, disabled }: Props) {
  const [state, setState] = useState<RecordingState>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    // getUserMedia solo funciona en HTTPS o localhost
    if (!window.isSecureContext) {
      toast.error("El micrófono requiere una conexión segura (HTTPS). Accedé al sistema por HTTPS o desde localhost.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error(`MediaDevices no disponible. isSecureContext=${window.isSecureContext}, URL=${window.location.origin}`);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Elegir el formato más compatible
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Detener el stream del microfono
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, { type: mimeType });
        await transcribeAudio(blob, mimeType);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setState("recording");
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          toast.error(
            "Permiso de micrófono denegado. Hacé clic en el ícono del candado (🔒) en la barra de direcciones y permitís el micrófono.",
            { duration: 6000 }
          );
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          toast.error("No se encontró ningún micrófono conectado.");
        } else {
          toast.error(`Error de micrófono: ${err.message}`);
        }
      } else {
        const name = (err as Error)?.name ?? "desconocido";
        const msg = (err as Error)?.message ?? String(err);
        toast.error(`Error de micrófono [${name}]: ${msg}`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
      setState("transcribing");
    }
  };

  const transcribeAudio = async (blob: Blob, mimeType: string) => {
    try {
      const ext = mimeType.includes("ogg") ? ".ogg" : ".webm";
      const formData = new FormData();
      formData.append("audio", blob, `recording${ext}`);

      const response = await fetch("/api/v1/transcribe/", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || `Error ${response.status}`);
      }

      const data = await response.json();
      if (data.text) {
        onTranscript(data.text);
        toast.success(`Transcripto (${data.duration_seconds}s de audio)`);
      } else {
        toast.warning("No se detectó audio con voz. Intentá nuevamente.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al transcribir el audio");
    } finally {
      setState("idle");
    }
  };

  const handleClick = () => {
    if (state === "idle") {
      startRecording();
    } else if (state === "recording") {
      stopRecording();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || state === "transcribing"}
      title={
        state === "idle"
          ? "Grabar nota de voz"
          : state === "recording"
          ? "Detener grabación"
          : "Transcribiendo..."
      }
      className={`
        flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
        transition-all duration-200 disabled:cursor-not-allowed
        ${state === "recording"
          ? "bg-red-100 text-red-700 border border-red-300 animate-pulse"
          : state === "transcribing"
          ? "bg-gray-100 text-gray-400 border border-gray-200"
          : "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
        }
      `}
    >
      {state === "transcribing" ? (
        <>
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Transcribiendo...
        </>
      ) : state === "recording" ? (
        <>
          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          Detener
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
          Dictar
        </>
      )}
    </button>
  );
}
