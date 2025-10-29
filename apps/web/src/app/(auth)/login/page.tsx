"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import { Button } from "@english-app/ui";

import styles from "./styles.module.css";

export default function LoginPage() {
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
      setFeedback("Verifique seu e-mail para continuar.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <h1 className={styles.title}>Entre no English App</h1>
        <p className={styles.subtitle}>Conecte-se com o Google ou receba um link por e-mail.</p>

        <Button
          variant="primary"
          onClick={() => signIn("google", { callbackUrl })}
          className={styles.providerButton}
        >
          Entrar com Google
        </Button>

        <div className={styles.separator}>
          <span />
          <p>ou</p>
          <span />
        </div>

        <form className={styles.form} onSubmit={handleEmailLogin}>
          <label className={styles.label} htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="seu.email@empresa.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={styles.input}
            required
          />
          <Button type="submit" variant="secondary" disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar link mágico"}
          </Button>
        </form>

        {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
        {status === "check-email" ? (
          <p className={styles.feedback}>Link enviado! Confira sua caixa de entrada.</p>
        ) : null}
      </div>
    </div>
  );
}
