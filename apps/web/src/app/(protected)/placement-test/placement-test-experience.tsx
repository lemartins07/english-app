"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@english-app/ui";

import { LevelTest } from "@/components/learning/level-test";

export default function PlacementTestExperience() {
  const router = useRouter();
  const completionTriggeredRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommendedLevel, setRecommendedLevel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function finalizePlacement(level: string) {
    if (isSubmitting) {
      return;
    }

    setRecommendedLevel(level);
    setError(null);
    setIsSubmitting(true);

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

      router.replace("/dashboard");
      router.refresh();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Ocorreu um erro inesperado ao concluir o placement test.";
      setError(message);
      setIsSubmitting(false);
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
    if (!recommendedLevel || isSubmitting) {
      return;
    }
    void finalizePlacement(recommendedLevel);
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

        <LevelTest onComplete={handleComplete} />
      </div>

      {isSubmitting ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-white/80 px-6 text-center backdrop-blur-sm dark:bg-slate-950/80">
          <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-300">
            Gerando plano personalizado
          </p>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-50">
            Tudo pronto! Redirecionando para o dashboard…
          </p>
          {recommendedLevel ? (
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Nível recomendado: <span className="font-medium">{recommendedLevel}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
