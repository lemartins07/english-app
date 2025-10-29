"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useFeatureFlag } from "../shared/feature-flags/context";

const BENEFITS = [
  {
    title: "Plano APA de 7 dias",
    description: "Aulas curtas (10-20 min) com Presentation → Assimilation → Active Recall.",
  },
  {
    title: "Teacher AI",
    description:
      "Correções amigáveis, role-play de entrevistas e vocabulário técnico contextualizado.",
  },
  {
    title: "Dashboard de progresso",
    description: "Acompanhe sua evolução semanal e pontos fortes com métricas claras.",
  },
];

const BASE_MODULES = [
  { name: "Plano personalizado", status: "Disponível" },
  { name: "Teacher AI Chat", status: "Disponível" },
  { name: "Simulador de Entrevista", status: "Em validação" },
  { name: "Glossário técnico", status: "Em desenvolvimento" },
];

export default function Home() {
  const { data: session, status } = useSession();
  const isLoadingSession = status === "loading";
  const isInterviewSimulatorEnabled = useFeatureFlag("interviewSimulator");

  const modules = BASE_MODULES.map((module) =>
    module.name === "Simulador de Entrevista" && isInterviewSimulatorEnabled
      ? { ...module, status: "Beta liberado" }
      : module,
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18)_0,_rgba(255,255,255,0)_45%)]" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-blue-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            AI
          </span>
          English AI Tutor
        </Link>
        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <Button variant="ghost" onClick={() => window.location.assign("/dashboard")}>
                Ir para dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  void signOut({ callbackUrl: "/" });
                }}
              >
                Sair
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Receber link</Link>
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  void signIn("google", { callbackUrl: "/dashboard" });
                }}
              >
                Entrar com Google
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-24 pt-10">
        <section className="grid gap-12 md:grid-cols-[1.15fr_0.85fr] md:items-center">
          <div className="space-y-6">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              MVP focado em entrevistas técnicas
            </Badge>
            <h1 className="text-4xl font-semibold text-blue-900 sm:text-5xl">
              Evolua para o nível C1 com um tutor de inglês feito para profissionais de TI.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground">
              Combine plano personalizado, aulas APA curtas e um Teacher AI que entende desafios de
              backend, frontend, data e devops. Prepare-se para entrevistas com confiança.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  if (session?.user) {
                    window.location.assign("/dashboard");
                    return;
                  }
                  void signIn("google", { callbackUrl: "/dashboard" });
                }}
                disabled={isLoadingSession}
              >
                {session?.user ? "Continuar estudos" : "Começar agora"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {!session?.user && (
                <Button variant="ghost" size="lg" asChild>
                  <Link href="/login">Entrar com link mágico</Link>
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Aulas em português e inglês
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Foco em entrevistas + vocabulário técnico
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Plano de 7 dias com métricas de retenção
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-blue-400/40 to-blue-600/10 blur-3xl" />
            <div className="rounded-3xl border border-blue-100 bg-white/80 p-6 shadow-2xl backdrop-blur">
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-900">Seu plano APA</span>
                  <Badge variant="outline" className="text-xs text-blue-600">
                    7 dias
                  </Badge>
                </div>
                <div className="rounded-2xl bg-blue-50 p-4 text-blue-900">
                  <p className="text-sm font-medium">Dia 3 — Problem-Solving Vocabulary</p>
                  <p className="text-xs text-blue-700">
                    Debugging, optimization, architecture decisions para entrevistas técnicas.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {["Presentation", "Assimilation", "Active Recall"].map((phase) => (
                    <div key={phase} className="rounded-lg border border-blue-100 p-3">
                      <p className="text-blue-900 font-semibold">{phase}</p>
                      <p className="text-blue-700/70">10-20 min</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-dashed border-blue-200 p-4">
                  <p className="text-xs uppercase text-blue-600">Teacher AI</p>
                  <p className="text-sm text-blue-900">
                    “Hi Ana! Ready for a mock interview? Let’s practice describing your latest
                    backend project using STAR.”
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 rounded-3xl border border-blue-100 bg-white/70 p-8 shadow-lg backdrop-blur sm:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="space-y-2">
              <h3 className="text-base font-semibold text-blue-900">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              Metodologia clara
            </Badge>
            <h2 className="text-3xl font-semibold text-blue-900">APA + Teacher AI + simulador</h2>
            <p className="text-sm text-muted-foreground">
              Aplicamos o método Presentation → Assimilation → Active Recall → Feedback & Next em um
              plano semanal. Cada módulo é desbloqueado via feature flag para garantir entregas
              estáveis.
            </p>
            <div className="space-y-3">
              {modules.map((module) => (
                <div
                  key={module.name}
                  className="flex items-center justify-between rounded-xl border border-blue-100 bg-white/80 px-4 py-3 text-sm"
                >
                  <span className="font-medium text-blue-900">{module.name}</span>
                  <span className="text-xs text-muted-foreground">{module.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white/70 p-8 shadow-lg backdrop-blur">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">Indicadores de sucesso</p>
                <p className="text-xs text-muted-foreground">
                  Foco em retenção D+1 e confiança em entrevistas
                </p>
              </div>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-between rounded-xl bg-blue-50 p-4">
                <div>
                  <p className="font-semibold text-blue-900">KR1</p>
                  <p>Retenção D+1 ≥ 30%</p>
                </div>
                <Badge variant="outline" className="text-blue-600">
                  Em medição
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-green-50 p-4">
                <div>
                  <p className="font-semibold text-green-900">KR2</p>
                  <p>≥60% concluem 4/7 lições</p>
                </div>
                <Badge variant="outline" className="text-green-600">
                  Beta interno
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-orange-50 p-4">
                <div>
                  <p className="font-semibold text-orange-900">KR3</p>
                  <p>CSAT ≥ 4,2/5</p>
                </div>
                <Badge variant="outline" className="text-orange-600">
                  Próxima sprint
                </Badge>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-blue-100 bg-blue-600 text-white p-10 shadow-lg">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Pronto para treinar entrevistas com IA?</h2>
              <p className="text-sm text-blue-100">
                Receba acesso ao plano APA, Teacher AI e simulador de entrevista em minutos.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => {
                  if (session?.user) {
                    window.location.assign("/dashboard");
                    return;
                  }
                  void signIn("google", { callbackUrl: "/dashboard" });
                }}
              >
                {session?.user ? "Abrir dashboard" : "Criar conta com Google"}
              </Button>
              {!session?.user && (
                <Button variant="ghost" size="lg" asChild>
                  <Link href="/login" className="text-white hover:text-blue-100">
                    Receber link mágico
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white/70 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} English AI Tutor. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/lemartins07/Englishappdesign"
              target="_blank"
              className="hover:text-blue-600"
            >
              Design & mock data
            </Link>
            <Link href="mailto:hello@englishapp.dev" className="hover:text-blue-600">
              hello@englishapp.dev
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
