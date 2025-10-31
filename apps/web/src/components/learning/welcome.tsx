"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Sparkles } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@english-app/ui";

interface OnboardingWelcomeProps {
  defaultName?: string;
  onNext: () => void;
  onUpdateProfile: (updates: { name: string }) => void;
}

export function OnboardingWelcome({
  defaultName = "",
  onNext,
  onUpdateProfile,
}: OnboardingWelcomeProps) {
  const [name, setName] = useState(defaultName);
  const [showForm, setShowForm] = useState(Boolean(defaultName));

  useEffect(() => {
    if (defaultName) {
      setName(defaultName);
      setShowForm(true);
    }
  }, [defaultName]);

  const handleContinue = () => {
    if (!name.trim()) return;
    onUpdateProfile({ name: name.trim() });
    onNext();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid w-full max-w-5xl gap-8 md:grid-cols-2"
      >
        <div className="flex flex-col justify-center space-y-6 text-center md:text-left">
          <div className="flex justify-center md:justify-start">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-blue-900 md:text-4xl">
              Bem-vindo ao English AI Tutor
            </h1>
            <p className="text-base text-muted-foreground">
              Melhore seu inglês para entrevistas técnicas com aulas personalizadas de 10-20
              minutos. Avance do seu nível atual até C1 com metodologia comprovada e suporte de IA.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: "⚡", title: "Aulas de 10-20 min", subtitle: "Método APA otimizado" },
              { icon: "🎯", title: "Focado em TI", subtitle: "Vocabulário técnico" },
              { icon: "🤖", title: "Teacher AI", subtitle: "Feedback personalizado" },
            ].map((item) => (
              <Card
                key={item.title}
                className="border-dashed border-blue-100 bg-blue-50/40 shadow-none"
              >
                <CardContent className="px-4 py-6 text-center">
                  <div className="mb-2 text-2xl">{item.icon}</div>
                  <h3 className="text-sm font-semibold text-blue-900">{item.title}</h3>
                  <p className="text-xs text-blue-700">{item.subtitle}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="self-center">
          <CardHeader>
            <CardTitle>Vamos personalizar sua jornada</CardTitle>
            <CardDescription>
              Conte-nos seu nome para que possamos ajustar seu plano
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!showForm ? (
              <Button
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowForm(true)}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Começar agora
              </Button>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="onboarding-name">Seu nome</Label>
                  <Input
                    id="onboarding-name"
                    placeholder="Digite seu nome"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleContinue();
                      }
                    }}
                  />
                </div>
                <Button
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleContinue}
                  disabled={!name.trim()}
                >
                  Continuar
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
