# SPEC-1 — English AI Tutor (Lean Spec)

> Escopo desta versão: Documento enxuto, só com decisões de alto nível — requisitos funcionais e não funcionais, stack e metodologia (DDD + Clean Architecture + APA). Sem modelos de banco, algoritmos, prompts ou detalhes de implementação.

---

## Background

MVP para tutor de inglês com IA focado em **profissionais de TI brasileiros** que querem **passar em entrevistas** e progredir em direção ao **CEFR C1**. Diferencial: **plano personalizado** (nível atual + objetivo) e **aulas curtas no método APA (10–20 min)**, com **chat Teacher AI** e **simulador de entrevista**. Sucesso medido por **retenção D+1** e percepção de aprendizado.

---

## Requirements

### Público‑alvo e Objetivo

- Público: profissionais de **TI (backend, frontend, data, devops)** — UI em **PT‑BR**.
- Objetivo do produto: **preparar para entrevistas** (behavioral + técnico) e avançar rumo a **C1**.

### Funcionais (MoSCoW)

**Must**

1. **Onboarding** com **teste de nivelamento híbrido** (MCQ/listening + speaking curto) e seleção de **objetivo** (entrevista) e **trilha** (backend/frontend/data/devops).
2. **Plano de estudos personalizado** de **7 dias** com **aulas APA (10–20 min)**: Presentation → Assimilation → Active Recall → Feedback & Next.
3. **Teacher AI Chat** com correção amiga e mini‑desafio final; suporte a **role‑play de entrevista**.
4. **Dashboard** com progresso semanal e **feedback de fechamento**.
5. **Métrica de sucesso**: acompanhar **retenção D+1**.

**Should**

- **Simulador de entrevista** com rubrica (clareza, gramática, vocabulário técnico, fluência, STAR).
- **Glossário técnico** por trilha e exemplos em contexto.
- **Export** do plano (PDF/Markdown) e link compartilhável do objetivo.

**Could**

- Exercícios multimodais (listening/shadowing), checklist de portfólio (CV/LinkedIn/pitch), lembretes de estudo.

**Won’t (MVP)**

- Pagamento real (apenas **simulação de upgrade**).
- Correção de pronúncia avançada/tempo real.
- Social/features colaborativas.

### Não Funcionais

- **Desempenho:** p95 **chat ≤ 4 s** (streaming); **geração de plano ≤ 6 s**.
- **Confiabilidade:** disponibilidade alvo 99,5% no MVP; degradação graciosa se IA indisponível.
- **Privacidade/Security:** PII mínima (nome, e‑mail), **opt‑in** para melhoria de modelos, criptografia em trânsito, rate‑limit básico.
- **Observabilidade:** logs estruturados, métricas de uso (D0, D+1, conclusão de lições), erros p95/p99.
- **Acessibilidade:** alternativa em texto para itens de áudio; navegação teclado‑first.

### Indicadores de Sucesso (KRs)

- **KR1:** ≥ **30%** de **retenção D+1**.
- **KR2:** ≥ **60%** concluem **≥4/7** lições na semana 1.
- **KR3:** **CSAT ≥ 4,2/5** ao final da semana 1.
- **KR4:** ≥ **70%** reportam **maior segurança em entrevistas**.

---

## Stack (alto nível)

- **Aplicação Web:** **Next.js (App Router)** — UI + BFF (API Routes/Server Actions).
- **Autenticação:** **Auth.js/NextAuth** (e‑mail + Google).
- **Persistência:** **PostgreSQL** gerenciado. (Detalhes de esquema fora do escopo desta spec.)
- **Armazenamento de arquivos:** **S3‑compatível** (áudio, artefatos de lição).
- **IA:** Provedor **LLM** para geração/avaliação; provedor **ASR** para transcrição de speaking. (Escolha específica fora do escopo da spec; trocar via gate­ways.)
- **Deploy:** **Vercel** (app web + BFF). Considerar **worker** separado futuramente para tarefas longas.

> Nota: fornecedores (LLM/ASR/DB/S3) são substituíveis e não fazem parte das decisões rígidas deste documento.

---

## Arquitetura (visão de alto nível)

- **MVP em um único app Next.js** (UI + BFF) — **ADR‑001**. Domínio e Casos de Uso ficam em pacotes internos.
- **Fronteiras lógicas (DDD):**
  - **Assessment** (nivelamento), **Study Planning & Lessons (APA)**, **Interview Simulation** (core).
  - **Teacher Chat**, **Progress & Feedback**, **Content Catalog** (supporting).
  - **Identity & Access**, **Observability**, **Storage** (generic).
- **Clean Architecture:**
  - **Domínio:** entidades/VOs/regras (sem dependência externa).
  - **Aplicação:** **casos de uso** orquestram o fluxo.
  - **Adapters:** controladores/DTOs/repositórios/gateways (LLM/ASR/Storage/DB).
  - **Infra:** provedores e deploy.

Diagrama conceitual:

```
User → UI (Next.js)
UI → Application (Use Cases)
Application → Adapters (Repos, Gateways LLM/ASR/Storage)
Adapters → Infra (DB, S3, LLM, ASR)

```

**Evolução prevista (quando doer):** **ADR‑002** — mover tarefas longas (ex.: processamento de áudio extenso, agregações semanais) para um **worker** separado mantendo o BFF enxuto.

## Stack de UI sugerida (MVP)

- Base: Next.js 15, Tailwind, shadcn/ui, Radix

- Ícones: lucide-react

- Formulários: react-hook-form + zod

- Charts: recharts (mais simples e bonito pro MVP)

- Áudio: Web MediaRecorder + wavesurfer.js (visual opcional)

- Upload: react-dropzone (tarefas de speaking/writing)

## Metodologia de Desenvolvimento

- **Domain‑Driven Design (DDD):**
  - Modelar **bounded contexts** citados acima; linguagem ubíqua centrada em **entrevistas de TI** e **lições APA**.
  - Manter **regra de domínio** fora de controladores/adapters.
- **Clean Architecture:**
  - Dependências **de fora para dentro** apenas por **interfaces** (ports). Gateways para LLM/ASR/Storage **trocáveis**.
  - Testes de unidade no domínio/casos de uso; contratos para adapters.
- **Método APA (didática):**
  - Toda lição **10–20 min**, com fases **Presentation → Assimilation → Active Recall → Feedback & Next**.
  - Cada lição declara **objetivo linguístico** ligado a **entrevista**.
- **Forma de trabalho:**
  - Monorepo (apps + packages), CI com lint/build/test, feature flags para módulos novos (ex.: simulador de entrevista).
  - Observabilidade desde o início (latência p95 por caso de uso, eventos de retenção).

---

## Escopo Futuro (fora do MVP)

- Pagamentos reais; avaliação de pronúncia de baixa latência; social; recomendações avançadas; A/B de lições.

---

## Milestones (alto nível)

1. **M1 - Infraestrutura e Setup:** monorepo, app Next, autenticação, observabilidade mínima.
2. **M2 - Onboarding e Teste de Nivelamento:** nivelamento híbrido (inclui speaking curto) e resumo do perfil.
3. **M3 - Plano de Estudos e Lições APA:** geração de plano semana 1 e lições APA (7 dias).
4. **M4 - Chat e Simulador de Entrevista:** Teacher Chat (persona) e simulador de entrevista básico.
5. **M5 - Dashboard, Métricas e Deploy:** produção, dashboard e feedback semanal; medir **D+1**.

---

## Gathering Results (como avaliar)

- **Engajamento:** % de conclusão por lição e por semana; **retenção D+1**.
- **Satisfação:** **CSAT** pós‑semana; NPS opcional.
- **Efetividade:** autoavaliação de **confiança em entrevistas**; evolução de nível percebido (pré/pós semana 1).
- **Aprendizados do MVP:** coletar feedback qualitativo (pergunta aberta) para ajustar objetivos e trilhas.

---

## Bootstrap rápido do monorepo

1. Instale dependências com `pnpm install`.
2. Suba o app Next.js com `pnpm dev` (atalho para `pnpm --filter web dev`).
3. Rode checagens estáticas: `pnpm lint` e `pnpm typecheck`.
4. Gere build de produção: `pnpm -w turbo run build`.

### Banco de dados (PostgreSQL)

- Suba o Postgres localmente com `docker compose -f docker-compose.dev.yml up -d db`. O serviço expõe `localhost:5432` e inclui health check automático.
- Configure `DATABASE_URL` (veja `.env.example`). O formato esperado é `postgresql://<user>:<password>@<host>:<port>/<database>`.
- Aplique as migrações com `pnpm db:migrate` (usa `prisma migrate deploy`) e popule dados essenciais com `pnpm db:seed` (idempotente, garante `user@example.com`).
- Inspecione os dados com `pnpm prisma:studio`; encerre o Postgres com `docker compose -f docker-compose.dev.yml down` quando não precisar mais.

### OpenAI / IA

- `OPENAI_API_KEY` e `OPENAI_MODEL` são obrigatórios para habilitar o provider OpenAI — a aplicação aborta com mensagem clara se faltarem.
- `OPENAI_BASE_URL` é opcional e permite apontar para gateways compatíveis (ex.: proxies internos). O SDK usa `https://api.openai.com/v1` por padrão.

### Estrutura de pastas

```
apps/
  web/                 # Next.js App Router (UI + API Routes/BFF)
packages/
  domain/              # Entidades/VOs (DDD)
  application/         # Casos de uso e contratos de orquestração
  adapters/            # Implementações concretas (ex.: repos, gateways)
  observability/       # Portas de logging/tracing reutilizáveis
  ui/                  # Componentes React compartilhados
```

> Pré-requisitos: Node.js 18.17+ e pnpm 8+. Utilize `corepack enable` para alinhar versões com o `packageManager` do projeto.

### Convenções de qualidade

- Commits seguem o padrão **Conventional Commits** (verificados por commitlint no hook `commit-msg`).
- Husky roda `lint-staged` antes do commit para formatar e executar ESLint nos arquivos alterados.
- Sempre valide `pnpm lint` e `pnpm typecheck` antes de abrir/atualizar um PR.

### API Docs

- Em desenvolvimento, acesse `http://localhost:3000/api-docs` para visualizar o Swagger UI.
- O documento bruto fica em `http://localhost:3000/api/openapi.json` (OpenAPI 3.1).
- Gere o arquivo localmente com `pnpm openapi:generate` (`apps/web/.openapi/openapi.json`).
- Valide o spec usando `pnpm openapi:lint` (Spectral). O CI falha se o spec estiver inválido.

### Feature Flags

- Configuração padrão em `apps/web/feature-flags.json`; sobrescreva com a env `FEATURE_FLAGS` (JSON string) ou defina `FEATURE_FLAGS_FILE` apontando para outro arquivo.
- Flags disponíveis acessíveis via `withFeatureFlagGuard(flag, handler)` no BFF (`api/echo` usa `interviewSimulator` como exemplo).
- No frontend, `FeatureFlagsProvider` injeta as flags na árvore (ver `apps/web/src/app/layout.tsx`); use `useFeatureFlag("interviewSimulator")` para controlar menus/componentes.

### Autenticação (Auth.js)

- Copie `.env.example` para `.env` e preencha credenciais: `AUTH_SECRET`, `DATABASE_URL`, par OAuth do Google (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`) e remetente de e-mail (`EMAIL_FROM`). `RESEND_API_KEY` é opcional em dev (fallback loga o link no console). Caso use um SMTP local (Mailhog/Maildev), aponte `EMAIL_SERVER` para `smtp://localhost:1025`.
- Para subir o MailHog localmente, execute `docker compose -f docker-compose.dev.yml up mailhog` e acesse a interface em `http://localhost:8025` (SMTP: `localhost:1025`).
- Gere o Prisma Client alinhado ao schema em `prisma/schema.prisma`: `PRISMA_GENERATE_SKIP_AUTOINSTALL=1 pnpm --filter web exec prisma generate` (necessário após instalar dependências ou mudar o schema).
- Rode migrações ou `prisma db push` apontando para o Postgres definido em `DATABASE_URL` antes de iniciar o app.
- O fluxo `/login` oferece Google OAuth e link mágico por e-mail; APIs protegidas retornam `401` e páginas privadas redirecionam para `/login`.
- Helpers de sessão vivem em `apps/web/src/server/auth/*` (`withAuthGuard`, `getCurrentUser`, `requireUser`).
