"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VoiceInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function VoiceInput({
  value,
  onChange,
  placeholder = "Describe your idea — talk about what makes this topic interesting, your unique angle, key points you want to cover...",
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Microphone access denied. Please allow microphone permission.");
      return;
    }

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      // Stop all tracks to release mic
      stream.getTracks().forEach((t) => t.stop());
      stopTimer();
      setIsRecording(false);

      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      if (blob.size === 0) return;

      setIsTranscribing(true);
      try {
        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");

        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(await res.text());
        }

        const { text } = await res.json();
        if (text) {
          const separator = value.trim() ? " " : "";
          onChange(value.trim() + separator + text);
        }
      } catch (err) {
        console.error("[VoiceInput] transcription error:", err);
        toast.error("Transcription failed. Please try again or type your idea.");
      } finally {
        setIsTranscribing(false);
      }
    };

    mediaRecorder.start();
    setIsRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }, [value, onChange, stopTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      stopTimer();
    };
  }, [stopTimer]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const busy = isRecording || isTranscribing;

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={busy}
          placeholder={placeholder}
          rows={4}
          className={cn(
            "flex w-full rounded-md border border-input bg-transparent px-3 py-2 pr-12 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-y min-h-[100px]",
            isRecording && "border-red-400 ring-[3px] ring-red-100"
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isTranscribing}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isRecording) {
              stopRecording();
            } else {
              startRecording();
            }
          }}
          className={cn(
            "absolute top-2 right-2 h-8 w-8 rounded-full z-10",
            isRecording && "text-red-500 animate-pulse hover:text-red-600"
          )}
        >
          {isTranscribing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isRecording ? (
            <Square className="h-4 w-4 fill-current" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          Recording... ({formatTime(seconds)})
        </div>
      )}

      {isTranscribing && (
        <p className="text-sm text-muted-foreground">
          Transcribing your recording...
        </p>
      )}
    </div>
  );
}
