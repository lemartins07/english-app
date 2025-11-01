import { useRef, useState } from "react";

interface AudioRecorderState {
  isRecording: boolean;
  audioBlob: Blob | null;
  error: Error | null;
}

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    audioBlob: null,
    error: null,
  });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  async function startRecording() {
    setState({ isRecording: true, audioBlob: null, error: null });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/wav" });
        setState((prev) => ({ ...prev, isRecording: false, audioBlob }));
      };

      mediaRecorder.start();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as Error, isRecording: false }));
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  return { ...state, startRecording, stopRecording };
}
