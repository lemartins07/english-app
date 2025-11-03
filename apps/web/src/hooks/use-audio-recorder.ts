import { useCallback, useRef, useState } from "react";

interface AudioRecorderState {
  isRecording: boolean;
  audioBlob: Blob | null;
  error: Error | null;
  elapsedMs: number;
  hasRecording: boolean;
}

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    audioBlob: null,
    error: null,
    elapsedMs: 0,
    hasRecording: false,
  });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  async function startRecording() {
    stopTimer();
    setState({
      isRecording: true,
      audioBlob: null,
      error: null,
      elapsedMs: 0,
      hasRecording: false,
    });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      streamRef.current = stream;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/wav" });

        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        stopTimer();

        setState((prev) => ({
          ...prev,
          isRecording: false,
          audioBlob,
          elapsedMs: prev.elapsedMs,
          hasRecording: true,
        }));
      };

      mediaRecorder.start();
      timerRef.current = window.setInterval(() => {
        setState((prev) => ({
          ...prev,
          elapsedMs: prev.elapsedMs + 1000,
        }));
      }, 1000);
    } catch (error) {
      stopTimer();
      setState((prev) => ({
        ...prev,
        error: error as Error,
        isRecording: false,
        elapsedMs: 0,
      }));
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    stopTimer();
    setState((prev) => ({ ...prev, isRecording: false }));
  }

  return { ...state, startRecording, stopRecording };
}
