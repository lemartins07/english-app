"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@english-app/ui";

import { LevelTest } from "@/components/learning/level-test";

interface PlacementTestExperienceProps {
  initialStatus?: "idle" | "submitting" | "completed" | "error";
  initialLevel?: string | null;
}

export default function PlacementTestExperience({
  initialStatus = "idle",
  initialLevel = null,
}: PlacementTestExperienceProps) {
  const router = useRouter();
  const completionTriggeredRef = useRef(initialStatus === "completed");
  const [status, setStatus] = useState<"idle" | "submitting" | "completed" | "error">(
    initialStatus,
  );
  const [recommendedLevel, setRecommendedLevel] = useState<string | null>(initialLevel);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function finalizePlacement(level: string) {
    if (status === "submitting") {
      return;
    }

    setRecommendedLevel(level);
    setError(null);
    setStatus("submitting");

    try {
      const response = await fetch("/api/user/placement-test/complete", {
        method: "POST",
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Não foi possível concluir o placement test. Tente novamente em instantes.",
        );
      }

      setStatus("completed");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Ocorreu um erro inesperado ao concluir o placement test.";
      setError(message);
      setStatus("error");
    }
  }

  function handleComplete(level: string) {
    if (completionTriggeredRef.current) {
      return;
    }
    completionTriggeredRef.current = true;
    void finalizePlacement(level);
  }

  function handleRetry() {
    if (!recommendedLevel || status === "submitting") {
      return;
    }
    void finalizePlacement(recommendedLevel);
  }

  function handleGoToDashboard() {
    router.replace("/dashboard");
    router.refresh();
  }

  function handleRetake() {
    completionTriggeredRef.current = false;
    setStatus("idle");
    setRecommendedLevel(null);
    setError(null);
    setAttempt((prev) => prev + 1);
  }

  return (
    <section className="relative">
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 sm:p-6">
        {error ? (
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-900/30 dark:text-red-100">
            <span>{error}</span>
            {recommendedLevel ? (
              <div>
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  Tentar novamente
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {status === "completed" && recommendedLevel ? (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl">🎉</span>
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">
                Parabéns! Seu nível recomendado é
              </h2>
              <span className="text-6xl font-bold text-blue-600 dark:text-blue-300">
                {recommendedLevel}
              </span>
              <p className="max-w-xl text-sm text-slate-600 dark:text-slate-300">
                Personalizamos seu dashboard com atividades focadas em speaking, listening e
                grammar. Siga praticando para evoluir rapidamente rumo às entrevistas
                internacionais.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={handleGoToDashboard}>
                Começar a praticar
              </Button>
              <Button size="lg" variant="outline" onClick={handleRetake}>
                Refazer teste
              </Button>
            </div>
          </div>
        ) : (
          <LevelTest key={attempt} onComplete={handleComplete} submissionState={status} />
        )}
      </div>

      {status === "submitting" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-white/85 px-6 text-center backdrop-blur-sm dark:bg-slate-950/85">
          <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-300">
            Gerando plano personalizado
          </p>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-50">
            Estamos analisando seu teste. Isso leva apenas alguns instantes…
          </p>
        </div>
      ) : null}
    </section>
  );
}
