"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { LogIn, Mail, Sparkles } from "lucide-react";

import { Button, Input, Label } from "@english-app/ui";

function LoginContent() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const status = params.get("status");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      setFeedback("Informe um e-mail válido para receber o link de acesso.");
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const result = await signIn("email", {
      email,
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      setFeedback("Não foi possível enviar o link de acesso. Tente novamente em instantes.");
    } else {
      setFeedback("Verifique sua caixa de entrada para continuar.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-12 dark:from-neutral-950 dark:via-neutral-900 dark:to-black">
      <div className="w-full max-w-md rounded-3xl border border-blue-100/60 bg-white/80 p-8 shadow-2xl backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="mb-8 space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <LogIn className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold text-blue-900 dark:text-white">
            Entre no English AI Tutor
          </h1>
          <p className="text-sm text-muted-foreground dark:text-neutral-300">
            Conecte-se com sua conta Google ou receba um link mágico por e-mail.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => signIn("google", { callbackUrl })}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Entrar com Google
          </Button>

          <div className="relative my-4 flex items-center text-xs uppercase tracking-[0.2em] text-muted-foreground dark:text-neutral-400">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-200 to-transparent dark:via-neutral-700" />
            <span className="px-3">ou</span>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-200 to-transparent dark:via-neutral-700" />
          </div>

          <form className="space-y-4" onSubmit={handleEmailLogin}>
            <div className="space-y-2 text-left">
              <Label htmlFor="email">E-mail corporativo</Label>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="seu.email@empresa.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              <Mail className="mr-2 h-4 w-4" />
              {isSubmitting ? "Enviando..." : "Enviar link mágico"}
            </Button>
          </form>
        </div>

        {feedback ? (
          <p className="mt-6 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
            {feedback}
          </p>
        ) : null}
        {status === "check-email" ? (
          <p className="mt-6 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-500/10 dark:text-green-200">
            Link enviado! Confira sua caixa de entrada.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-12 dark:from-neutral-950 dark:via-neutral-900 dark:to-black">
          <div className="text-sm text-muted-foreground">Carregando página de login...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
