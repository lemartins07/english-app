import { redirect } from "next/navigation";

import { getCurrentUser } from "@/server/auth";

import PlacementTestExperience from "./placement-test-experience";

export default async function PlacementTestPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.hasCompletedPlacementTest) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6">
      <header className="rounded-3xl border border-blue-500/30 bg-blue-500/5 p-8 text-blue-900 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-50">
        <p className="text-sm uppercase tracking-wide text-blue-700/80 dark:text-blue-200/80">
          Trilha personalizada
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
          Complete seu teste de nivelamento para liberar o dashboard
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-blue-900/80 dark:text-blue-50/80">
          Responda às perguntas abaixo para que possamos recomendar o nível ideal e montar seu plano
          de estudos APA para entrevistas técnicas em inglês.
        </p>
        <ul className="mt-6 grid gap-3 text-sm text-blue-900/70 dark:text-blue-100/70 sm:grid-cols-3">
          <li className="rounded-2xl border border-blue-500/20 bg-white/60 px-4 py-3 dark:border-blue-500/10 dark:bg-blue-500/10">
            🎯 Avaliação rápida de conhecimento atual
          </li>
          <li className="rounded-2xl border border-blue-500/20 bg-white/60 px-4 py-3 dark:border-blue-500/10 dark:bg-blue-500/10">
            🔄 Alterna entre múltipla escolha, listening e speaking
          </li>
          <li className="rounded-2xl border border-blue-500/20 bg-white/60 px-4 py-3 dark:border-blue-500/10 dark:bg-blue-500/10">
            🚀 Libera seu dashboard e plano de estudos ao final
          </li>
        </ul>
      </header>

      <PlacementTestExperience />
    </div>
  );
}
