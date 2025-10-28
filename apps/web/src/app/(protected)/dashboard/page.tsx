import Link from "next/link";

import { getCurrentUser } from "../../../server/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <main style={{ padding: "48px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 style={{ fontSize: 32, fontWeight: 600 }}>Bem-vindo de volta 👋</h1>
        <p style={{ fontSize: 16, color: "#475569" }}>
          {user?.name
            ? `Ótimo te ver novamente, ${user.name}!`
            : "Você já pode montar seu plano personalizado e iniciar o nivelamento."}
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
        }}
      >
        <article
          style={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            padding: 24,
            background: "linear-gradient(145deg, #eef2ff 0%, #f8fafc 100%)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Plano da semana</h2>
          <p style={{ margin: 0, fontSize: 14, color: "#475569" }}>
            Vamos montar um plano APA de 7 dias alinhado às entrevistas da sua trilha.
          </p>
          <Link
            href="/"
            style={{
              fontSize: 14,
              color: "#4338ca",
              fontWeight: 500,
              textDecoration: "underline",
              textDecorationThickness: 2,
              textDecorationColor: "#a5b4fc",
              width: "fit-content",
            }}
          >
            Ver roadmap →
          </Link>
        </article>
      </section>
    </main>
  );
}
