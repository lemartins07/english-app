"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

  const quickActions = useMemo(
    () => [
      { label: "Practice interview", icon: Target },
      { label: "Correct my text", icon: Sparkles },
      { label: "Explain a concept", icon: Sparkles },
    ],
    [],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const generateAIResponse = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("interview") || lower.includes("practice")) {
      return `Great! Let's practice an interview scenario. 🎯\n\nImagine you're interviewing for a ${profile.track} position. I'll ask you:\n\n"Can you tell me about a challenging bug you fixed recently?"\n\nAnswer using the STAR method (Situation, Task, Action, Result).`;
    }
    if (lower.includes("correct") || lower.includes("grammar")) {
      return `I'd be happy to help correct your English! 📝\n\nSend me a sentence or paragraph and I'll give you feedback on grammar, vocabulary, and tone.`;
    }
    return `That's a great topic! For technical English in ${profile.track || "tech roles"}, try to:\n\n1. Be specific with technical terms\n2. Use active voice when describing your work\n3. Quantify your achievements when possible\n\nWould you like to practice a specific scenario or need vocabulary help?`;
  };

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    const text = input.trim();

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text, timestamp: new Date() },
    ]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ai",
          content: generateAIResponse(text),
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }, 1400);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <header className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Badge variant="outline" className="flex items-center gap-2 bg-green-50 text-green-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            Online
          </Badge>
        </header>

        <Card className="flex min-h-[600px] flex-col">
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
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={[
                        "flex max-w-[80%] items-start gap-2",
                        message.role === "user" ? "flex-row-reverse text-white" : "text-foreground",
                      ].join(" ")}
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
                          className={[
                            "whitespace-pre-line rounded-2xl px-4 py-3 text-sm shadow-sm",
                            message.role === "user"
                              ? "bg-blue-600 text-blue-50"
                              : "bg-muted text-foreground",
                          ].join(" ")}
                        >
                          {message.content}
                        </div>
                        {message.role === "ai" && (
                          <div className="mt-2 flex gap-2 pl-2 text-muted-foreground">
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
                className="min-h-[60px] resize-none"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="self-end bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <p className="pt-2 text-center text-xs text-muted-foreground">
              Teacher AI pode cometer erros. Revise informações importantes.
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="flex flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-orange-900">Pronto para o desafio?</h3>
              <p className="text-xs text-orange-700">
                Complete 5 lições para desbloquear o Simulador de Entrevista
              </p>
            </div>
            <Button
              onClick={onStartInterview}
              disabled={profile.completedDays.length < 5}
              className="bg-orange-600 hover:bg-orange-700"
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
