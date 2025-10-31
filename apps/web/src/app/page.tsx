"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  ArrowRight,
  Bot,
  Brain,
  CalendarCheck,
  CheckCircle2,
  LineChart,
  type LucideIcon,
  Rocket,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useFeatureFlag } from "../shared/feature-flags/context";

type Highlight = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const HIGHLIGHTS: Highlight[] = [
  {
    title: "Plano intensivo de 7 dias",
    description: "Mapeamos seu nível atual e objetivo para montar um ciclo de estudos enxuto.",
    icon: CalendarCheck,
  },
  {
    title: "Teacher AI sempre disponível",
    description: "Role-play de entrevistas, feedback amigável e microtarefas de speaking.",
    icon: Bot,
  },
  {
    title: "Metodologia APA",
    description: "Aulas de 10–20 min com Presentation → Assimilation → Active Recall → Feedback.",
    icon: Brain,
  },
  {
    title: "Simulador técnico",
    description: "Cenários de backend, frontend, dados e devops com rubrica de avaliação clara.",
    icon: Rocket,
  },
];

const STUDY_PLAN = [
  {
    day: "Dia 1",
    focus: "Nivelamento híbrido e meta de entrevista",
    outcome: "Plano personalizado liberado instantaneamente.",
  },
  {
    day: "Dias 2-5",
    focus: "Blocos APA com vocabulário técnico e shadowing",
    outcome: "Feedback diário + checkpoints de progresso.",
  },
  {
    day: "Dia 6",
    focus: "Simulador de entrevista com Teacher AI",
    outcome: "Rubrica com pontos fortes e próximos passos.",
  },
  {
    day: "Dia 7",
    focus: "Revisão guiada e export do plano",
    outcome: "Checklist para semana seguinte e métricas D+1.",
  },
];

const STUDY_FLOW = ["Presentation", "Assimilation", "Active Recall", "Feedback & Next"];

const METRICS = [
  {
    label: "KR1",
    description: "Retenção D+1 ≥ 30%",
    tone: "bg-blue-500/10 text-blue-200 border-blue-500/20",
    badge: "Em acompanhamento",
  },
  {
    label: "KR2",
    description: "≥60% concluem 4/7 lições",
    tone: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
    badge: "Beta interno",
  },
  {
    label: "KR3",
    description: "CSAT ≥ 4,2/5",
    tone: "bg-amber-500/10 text-amber-100 border-amber-500/20",
    badge: "Próxima sprint",
  },
];

const FAQS = [
  {
    question: "Preciso falar inglês o tempo todo?",
    answer:
      "Não. O onboarding, as instruções do plano e os feedbacks podem acontecer em português para garantir clareza, enquanto as práticas guiadas alternam entre PT-BR e EN.",
  },
  {
    question: "Como o Teacher AI corrige minhas respostas?",
    answer:
      "Utilizamos uma persona treinada para entrevistas de TI que destaca oportunidades de melhoria, sugere reformulações e registra exemplos que alimentam seu dashboard semanal.",
  },
  {
    question: "O simulador de entrevista já está disponível?",
    answer:
      "Liberamos gradualmente via feature flag. Quando habilitado, você recebe rubrica com clareza, vocabulário técnico, fluência e aplicação do método STAR.",
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

  const handlePrimaryAction = () => {
    if (session?.user) {
      window.location.assign("/dashboard");
      return;
    }

    void signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18)_0,_rgba(15,23,42,0.6)_50%,_rgba(15,23,42,1)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(600px_circle_at_0%_0%,rgba(99,102,241,0.18),transparent)]" />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 text-white">
            AI
          </span>
          English AI Tutor
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {session?.user ? (
            <>
              <Button
                variant="ghost"
                className="text-slate-100 hover:bg-slate-900/60"
                onClick={() => window.location.assign("/dashboard")}
              >
                Ir para dashboard
              </Button>
              <Button
                variant="outline"
                className="border-slate-700 bg-slate-900/70 text-slate-100 hover:bg-slate-900"
                onClick={() => {
                  void signOut({ callbackUrl: "/" });
                }}
              >
                Sair
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="text-slate-100 hover:bg-slate-900/60" asChild>
                <Link href="/login">Receber link</Link>
              </Button>
              <Button
                className="bg-sky-500 text-slate-900 hover:bg-sky-400"
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

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 pb-24 pt-12">
        <section className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <Badge variant="secondary" className="border-0 bg-slate-900/70 text-slate-100">
              Home reimaginada para profissionais de tecnologia
            </Badge>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Aprenda inglês estratégico para entrevistas com um tutor movido a IA.
            </h1>
            <p className="max-w-xl text-base text-slate-300">
              Combine plano de 7 dias, aulas APA enxutas e um Teacher AI treinado com cenários reais
              de backend, frontend, dados e devops. Foque no que importa: comunicar suas conquistas
              em inglês com confiança.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="bg-sky-500 text-slate-900 hover:bg-sky-400"
                onClick={handlePrimaryAction}
                disabled={isLoadingSession}
              >
                {session?.user ? "Continuar no dashboard" : "Quero meu plano"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {!session?.user && (
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-slate-100 hover:bg-slate-900/60"
                  asChild
                >
                  <Link href="/login">Entrar com link mágico</Link>
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-400" />
                Feedback em PT-BR e EN
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-400" />
                Simulador com rubrica STAR
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-400" />
                Métricas D+1 e evolução semanal
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-sky-400/40 via-indigo-500/30 to-transparent blur-3xl" />
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold text-slate-100">Plano intensivo APA</span>
                <Badge variant="outline" className="border-sky-400/40 bg-sky-400/10 text-sky-200">
                  7 dias
                </Badge>
              </div>
              <div className="mt-6 space-y-4 text-sm text-slate-200">
                {STUDY_PLAN.map((step) => (
                  <div
                    key={step.day}
                    className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4"
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-400">{step.day}</p>
                    <p className="mt-1 font-medium text-slate-100">{step.focus}</p>
                    <p className="mt-2 text-xs text-slate-400">{step.outcome}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Ciclo de cada lição
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
                  {STUDY_FLOW.map((phase) => (
                    <div
                      key={phase}
                      className="rounded-xl border border-slate-800/70 bg-slate-900/60 px-3 py-2"
                    >
                      <p className="font-semibold text-slate-100">{phase}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg backdrop-blur md:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((highlight) => {
            const Icon = highlight.icon;

            return (
              <div key={highlight.title} className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800/70 text-sky-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-100">{highlight.title}</h3>
                <p className="text-sm text-slate-300">{highlight.description}</p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Badge variant="secondary" className="border-0 bg-slate-900/70 text-slate-100">
              Módulos liberados por feature flag
            </Badge>
            <h2 className="text-3xl font-semibold text-slate-100">
              Entrega contínua com visão de roadmap
            </h2>
            <p className="text-slate-300">
              Mantemos o MVP enxuto e confiável. Conforme validamos hipóteses, liberamos novos
              módulos para o seu perfil — tudo acompanhado por métricas de impacto e feedback
              qualitativo.
            </p>
            <div className="space-y-3">
              {modules.map((module) => (
                <div
                  key={module.name}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-4 text-sm"
                >
                  <span className="font-medium text-slate-100">{module.name}</span>
                  <span className="text-xs text-slate-400">{module.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/80 p-8 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-400/10 text-sky-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">Indicadores de sucesso</p>
                <p className="text-xs text-slate-400">
                  Monitoramos aprendizado, retenção e confiança.
                </p>
              </div>
            </div>
            <div className="mt-8 space-y-4">
              {METRICS.map((metric) => (
                <div key={metric.label} className={`rounded-2xl border px-5 py-4 ${metric.tone}`}>
                  <p className="text-sm font-semibold">{metric.label}</p>
                  <p className="mt-1 text-sm">{metric.description}</p>
                  <Badge
                    variant="outline"
                    className="mt-4 border-white/30 bg-white/10 text-xs text-white"
                  >
                    {metric.badge}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-10 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <Badge variant="secondary" className="border-0 bg-slate-900/70 text-slate-100">
              Teacher AI + People skills
            </Badge>
            <h2 className="text-3xl font-semibold text-slate-100">
              Transforme respostas técnicas em histórias convincentes
            </h2>
            <p className="text-slate-300">
              Cada sessão de speaking gera feedback detalhado com exemplos reformulados, termos
              técnicos em contexto e próximos passos. Você entende como explicar decisões de
              arquitetura, trade-offs e resultados de forma clara.
            </p>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-sky-400/20 text-sky-300">
                  <Brain className="h-3.5 w-3.5" />
                </div>
                <p>Scripts de entrevistas comportamentais + técnicas adaptados ao seu stack.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-sky-400/20 text-sky-300">
                  <LineChart className="h-3.5 w-3.5" />
                </div>
                <p>Dashboard com evolução semanal, retenção e confiança relatada.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-sky-400/20 text-sky-300">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <p>
                  Correções amigáveis, sugestões de vocabulário e checkpoint final com próximos
                  passos.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-inner">
              <h3 className="text-lg font-semibold text-slate-100">Perguntas frequentes</h3>
              <div className="mt-5 space-y-4">
                {FAQS.map((faq) => (
                  <details
                    key={faq.question}
                    className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition-colors hover:border-slate-700"
                  >
                    <summary className="cursor-pointer list-none text-sm font-medium text-slate-100">
                      {faq.question}
                    </summary>
                    <p className="mt-3 text-sm text-slate-300">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
              <h3 className="text-lg font-semibold text-slate-100">Pronto para testar?</h3>
              <p className="mt-2 text-sm text-slate-300">
                Ganhe acesso ao plano completo, métricas e simulador assim que sua conta for criada.
                Cancele quando quiser — estamos medindo aprendizado, não lock-in.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  className="bg-sky-500 text-slate-900 hover:bg-sky-400"
                  onClick={handlePrimaryAction}
                  disabled={isLoadingSession}
                >
                  {session?.user ? "Abrir dashboard" : "Criar conta com Google"}
                </Button>
                {!session?.user && (
                  <Button variant="ghost" className="text-slate-100 hover:bg-slate-900/60" asChild>
                    <Link href="/login">Receber link mágico</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-10 text-center shadow-xl">
          <h2 className="text-3xl font-semibold text-slate-100">
            Comece agora e evolua rumo ao C1
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300">
            Receba seu plano personalizado em minutos, com aulas APA, Teacher AI dedicado e
            simulador de entrevista liberado progressivamente. O foco está na sua retenção e
            confiança.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              className="bg-sky-500 text-slate-900 hover:bg-sky-400"
              onClick={handlePrimaryAction}
              disabled={isLoadingSession}
            >
              {session?.user ? "Continuar estudos" : "Criar conta gratuita"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {!session?.user && (
              <Button
                variant="ghost"
                size="lg"
                className="text-slate-100 hover:bg-slate-900/60"
                asChild
              >
                <Link href="/login">Entrar com link mágico</Link>
              </Button>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950/80 py-8 text-slate-400">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} English AI Tutor. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/lemartins07/Englishappdesign"
              target="_blank"
              className="hover:text-slate-100"
            >
              Design & mock data
            </Link>
            <Link href="mailto:hello@englishapp.dev" className="hover:text-slate-100">
              hello@englishapp.dev
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
