"use client";

import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";

import { Button } from "@english-app/ui";

import { useFeatureFlag } from "../shared/feature-flags/context";

import styles from "./page.module.css";

export default function Home() {
  const { data: session, status } = useSession();
  const isInterviewSimulatorEnabled = useFeatureFlag("interviewSimulator");

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <p className={styles.description}>
          English App é um tutor de inglês com IA para profissionais de TI. Este é apenas o
          bootstrap inicial do monorepo.
        </p>

        <div className={styles.ctas}>
          {session?.user ? (
            <>
              <Button variant="primary" onClick={() => window.open("/dashboard", "_self")}>
                Ir para o dashboard
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  void signOut({ callbackUrl: "/" });
                }}
              >
                Sair
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                onClick={() => {
                  void signIn("google", { callbackUrl: "/dashboard" });
                }}
              >
                Entrar com Google
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  window.open("/login", "_self");
                }}
              >
                Receber link por e-mail
              </Button>
            </>
          )}
        </div>
        {status === "loading" ? (
          <p className={styles.description}>Carregando sessão...</p>
        ) : session?.user ? (
          <p className={styles.description}>
            Logado como {session.user.email ?? session.user.name}. Seu ID é {session.user.id}.
          </p>
        ) : null}

        <section className={styles.modules}>
          <h2 className={styles.modulesTitle}>Módulos</h2>
          <p className={styles.modulesSubtitle}>
            Recursos liberados gradualmente com feature flags.
          </p>
          <ul className={styles.modulesList}>
            <li className={styles.moduleItem}>
              <span className={styles.moduleName}>Teacher Chat</span>
              <span className={styles.moduleTag}>Planejado</span>
            </li>
            {isInterviewSimulatorEnabled ? (
              <li className={styles.moduleItem}>
                <span className={styles.moduleName}>Simulador de Entrevista</span>
                <Button
                  variant="primary"
                  style={{ padding: "6px 12px", fontSize: 13 }}
                  onClick={() => {
                    alert(
                      "Simulador de entrevista liberado! Implemente a rota/client para continuar.",
                    );
                  }}
                >
                  Abrir
                </Button>
              </li>
            ) : (
              <li className={styles.moduleItem}>
                <span className={styles.moduleName}>Simulador de Entrevista</span>
                <span className={styles.moduleTag}>Em validação</span>
              </li>
            )}
          </ul>
        </section>
      </main>
      <footer className={styles.footer}>
        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/file.svg" alt="File icon" width={16} height={16} />
          Learn
        </a>
        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/window.svg" alt="Window icon" width={16} height={16} />
          Examples
        </a>
        <a
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/globe.svg" alt="Globe icon" width={16} height={16} />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
