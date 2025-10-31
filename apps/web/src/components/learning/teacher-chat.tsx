"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Send, Sparkles, Target, ThumbsDown, ThumbsUp } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Textarea,
} from "@english-app/ui";

import { useHealthStatus } from "@/hooks/use-health-status";
import { sendEchoMessage } from "@/lib/api/echo";
import { ApiRequestError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { useFeatureFlag } from "@/shared/feature-flags/context";

import {
  learningMutedText,
  learningPrimaryButton,
  learningSectionHeading,
  learningSubtleCard,
  learningSurfaceCard,
} from "./theme";
import { type LearningProfile } from "./types";

interface TeacherChatProps {
  profile: LearningProfile;
  onBack: () => void;
  onStartInterview: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

export function TeacherChat({ profile, onBack, onStartInterview }: TeacherChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "ai",
      content: `Hi ${profile.name || "there"}! I'm your AI English Teacher. 👋\n\nI can help you with:\n• Practice conversations\n• Correct your grammar\n• Role-play interview scenarios\n• Answer questions about technical vocabulary\n\nWhat would you like to practice today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pendingEchoController = useRef<AbortController | null>(null);

  const {
    status: healthStatus,
    latencyMs,
    error: healthError,
    refresh: refreshHealth,
  } = useHealthStatus({ intervalMs: 60_000 });
  const featureFlagEnabled = useFeatureFlag("interviewSimulator");
  const [echoAvailable, setEchoAvailable] = useState(featureFlagEnabled);

  const quickActions = useMemo(
    () => [
      { label: "Practice interview", icon: Target },
      { label: "Correct my text", icon: Sparkles },
      { label: "Explain a concept", icon: Sparkles },
    ],
    [],
  );

  const healthIndicator = useMemo(() => {
    if (healthStatus === "healthy") {
      const formattedLatency =
        typeof latencyMs === "number" ? `${Math.round(latencyMs)} ms` : undefined;
      return {
        label: formattedLatency ? `Online (${formattedLatency})` : "Online",
        container: "bg-green-50 text-green-700",
        dot: "bg-green-500",
        animated: true,
      };
    }

    if (healthStatus === "unhealthy") {
      return {
        label: "Offline",
        container: "bg-red-50 text-red-700",
        dot: "bg-red-500",
        animated: false,
      };
    }

    return {
      label: "Verificando...",
      container: "bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
      animated: true,
    };
  }, [healthStatus, latencyMs]);

  useEffect(() => {
    setEchoAvailable(featureFlagEnabled);
  }, [featureFlagEnabled]);

  useEffect(() => {
    return () => {
      pendingEchoController.current?.abort();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const generateAIResponse = useCallback(
    (text: string) => {
      const lower = text.toLowerCase();
      if (lower.includes("interview") || lower.includes("practice")) {
        return `Great! Let's practice an interview scenario. 🎯\n\nImagine you're interviewing for a ${profile.track} position. I'll ask you:\n\n"Can you tell me about a challenging bug you fixed recently?"\n\nAnswer using the STAR method (Situation, Task, Action, Result).`;
      }
      if (lower.includes("correct") || lower.includes("grammar")) {
        return `I'd be happy to help correct your English! 📝\n\nSend me a sentence or paragraph and I'll give you feedback on grammar, vocabulary, and tone.`;
      }
      return `That's a great topic! For technical English in ${profile.track || "tech roles"}, try to:\n\n1. Be specific with technical terms\n2. Use active voice when describing your work\n3. Quantify your achievements when possible\n\nWould you like to practice a specific scenario or need vocabulary help?`;
    },
    [profile.track],
  );

  const handleSend = useCallback(() => {
    if (!input.trim() || isTyping) {
      return;
    }

    const text = input.trim();
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    pendingEchoController.current?.abort();
    const controller = new AbortController();
    pendingEchoController.current = controller;

    void (async () => {
      try {
        let aiContent: string;
        let aiTimestamp = new Date();

        if (echoAvailable) {
          const response = await sendEchoMessage(text, { signal: controller.signal });
          aiContent = response.message;
          aiTimestamp = new Date(response.receivedAt);
        } else {
          aiContent = generateAIResponse(text);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "ai",
            content: aiContent,
            timestamp: aiTimestamp,
          },
        ]);
      } catch (error) {
        if ((error as { name?: string }).name === "AbortError") {
          return;
        }

        if (error instanceof ApiRequestError && error.status === 404) {
          setEchoAvailable(false);
        }

        void refreshHealth();

        const fallback = generateAIResponse(text);
        let reason: string;

        if (error instanceof ApiRequestError) {
          if (error.status === 404) {
            reason =
              "O simulador em tempo real está desativado no momento. Continuamos com uma resposta simulada.";
          } else if (error.status >= 500) {
            reason =
              "O tutor está indisponível agora. Vou responder localmente enquanto restabelecemos a conexão.";
          } else {
            reason = error.message;
          }
        } else {
          reason =
            "Não consegui falar com o tutor agora. Vamos continuar com uma resposta simulada.";
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "ai",
            content: `${fallback}\n\n_${reason}_`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    })();
  }, [generateAIResponse, input, isTyping, echoAvailable, refreshHealth]);

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <header className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="rounded-full bg-white/70 px-4 text-slate-700 shadow-sm hover:bg-white/90 dark:bg-neutral-800/70 dark:text-white dark:hover:bg-neutral-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              title={healthError ?? "Status do tutor"}
              className={["flex items-center gap-2", healthIndicator.container].join(" ")}
            >
              <span
                className={[
                  "h-2 w-2 rounded-full",
                  healthIndicator.dot,
                  healthIndicator.animated ? "animate-pulse" : "",
                ].join(" ")}
              />
              {healthIndicator.label}
            </Badge>
            {healthStatus === "unhealthy" && (
              <Button variant="ghost" size="sm" onClick={() => void refreshHealth()}>
                Tentar novamente
              </Button>
            )}
          </div>
        </header>

        <Card className={cn("flex min-h-[600px] flex-col", learningSurfaceCard)}>
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600">
                <AvatarFallback className="text-sm font-semibold text-white">AI</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Teacher AI</CardTitle>
                <p className="text-sm text-muted-foreground">Seu tutor de inglês personalizado</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "flex max-w-[80%] items-start gap-2",
                        message.role === "user"
                          ? "flex-row-reverse"
                          : "text-slate-700 dark:text-slate-200",
                      )}
                    >
                      {message.role === "ai" && (
                        <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600">
                          <AvatarFallback className="text-xs font-semibold text-white">
                            AI
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        <div
                          className={cn(
                            "whitespace-pre-line rounded-2xl px-4 py-3 text-sm shadow-sm",
                            message.role === "user"
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-blue-500/30"
                              : "bg-white/80 text-slate-700 dark:bg-neutral-900/70 dark:text-slate-200",
                          )}
                        >
                          {message.content}
                        </div>
                        {message.role === "ai" && (
                          <div className={cn("mt-2 flex gap-2 pl-2 text-xs", learningMutedText)}>
                            <button className="transition hover:text-blue-600" title="Útil">
                              <ThumbsUp className="h-4 w-4" />
                            </button>
                            <button className="transition hover:text-blue-600" title="Não útil">
                              <ThumbsDown className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600">
                    <AvatarFallback className="text-xs font-semibold text-white">AI</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {messages.length <= 2 && (
              <div className="my-3 flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(action.label)}
                    className="border-transparent bg-white/70 text-slate-700 shadow-sm hover:bg-white/90 dark:bg-neutral-800/70 dark:text-white dark:hover:bg-neutral-700"
                  >
                    <action.icon className="mr-1 h-3 w-3" />
                    {action.label}
                  </Button>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Escreva sua mensagem... (Enter para enviar)"
                className="min-h-[60px] resize-none rounded-2xl border border-blue-500/30 bg-white/80 shadow-inner focus-visible:border-blue-500 focus-visible:ring-blue-500 dark:bg-neutral-900/60"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className={cn(
                  "self-end rounded-full px-4",
                  learningPrimaryButton,
                  (!input.trim() || isTyping) &&
                    "bg-slate-300 text-slate-500 hover:bg-slate-300 dark:bg-neutral-800 dark:text-neutral-500",
                )}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <p className={cn("pt-2 text-center text-xs", learningMutedText)}>
              Teacher AI pode cometer erros. Revise informações importantes.
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "border-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-rose-500/10",
            learningSubtleCard,
          )}
        >
          <CardContent className="flex flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className={cn("text-sm font-semibold", learningSectionHeading)}>
                Pronto para o desafio?
              </h3>
              <p className={cn("text-xs", learningMutedText)}>
                Complete 5 lições para desbloquear o Simulador de Entrevista
              </p>
            </div>
            <Button
              onClick={onStartInterview}
              disabled={profile.completedDays.length < 5}
              className={cn(
                "rounded-full px-4",
                profile.completedDays.length < 5
                  ? "bg-slate-200 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500"
                  : learningPrimaryButton,
              )}
            >
              <Target className="mr-2 h-4 w-4" />
              {profile.completedDays.length < 5 ? "🔒 Bloqueado" : "Iniciar simulação"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
