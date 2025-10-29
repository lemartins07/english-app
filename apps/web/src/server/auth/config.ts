import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import { Resend } from "resend";

import { getObservabilityContext } from "@english-app/observability";

import { getPrisma } from "../db/client";
import { getEnv } from "../env";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/api/health",
  "/api/openapi.json",
  "/api/auth",
  "/_next",
] as const;

type Callbacks = NonNullable<NextAuthConfig["callbacks"]>;
type AuthorizedCallback = Callbacks extends { authorized?: infer T } ? T : never;
type SessionCallback = Callbacks extends { session?: infer T } ? T : never;
type JwtCallback = Callbacks extends { jwt?: infer T } ? T : never;
type AuthorizedParams = Parameters<NonNullable<AuthorizedCallback>>[0];
type SessionParams = Parameters<NonNullable<SessionCallback>>[0];
type JwtParams = Parameters<NonNullable<JwtCallback>>[0];

type Events = NonNullable<NextAuthConfig["events"]>;
type SignInEvent = Events extends { signIn?: infer T } ? T : never;
type SignOutEvent = Events extends { signOut?: infer T } ? T : never;
type SignInParams = Parameters<NonNullable<SignInEvent>>[0];
type SignOutParams = Parameters<NonNullable<SignOutEvent>>[0];

type SessionUser = DefaultSession["user"] & {
  id: string;
  role: Role;
};

type Env = ReturnType<typeof getEnv>;

type VerificationEmailParams = {
  identifier: string;
  url: string;
};

type AuthRuntime = ReturnType<typeof NextAuth>;

let cachedAuthRuntime: AuthRuntime | null = null;

const REQUIRED_AUTH_ENV = [
  "AUTH_SECRET",
  "DATABASE_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "EMAIL_FROM",
] as const;

export function hasAuthEnvironment(): boolean {
  return REQUIRED_AUTH_ENV.every((key) => {
    const value = process.env[key];
    return typeof value === "string" && value.length > 0;
  });
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function hasAuthenticatedUser(auth: AuthorizedParams["auth"]): boolean {
  if (!auth || typeof auth !== "object" || auth === null) {
    return false;
  }

  if ("user" in auth && Boolean((auth as { user?: unknown }).user)) {
    return true;
  }

  return false;
}

function createVerificationSender(env: Env, resend: Resend | null) {
  return async function sendVerificationEmail({ identifier, url }: VerificationEmailParams) {
    const { logger } = getObservabilityContext();

    if (!resend) {
      logger.warn("RESEND_API_KEY not configured, falling back to console email", {
        route: "auth.email",
      });
      // eslint-disable-next-line no-console
      console.log(`[auth] Sign-in link for ${identifier}: ${url}`);
      return;
    }

    await resend.emails.send({
      from: env.EMAIL_FROM,
      to: identifier,
      subject: "Your English App sign-in link",
      html: [
        `<p>Hello!</p>`,
        `<p>Use the secure link below to finish signing in to English App. It expires in 10 minutes.</p>`,
        `<p><a href="${url}" target="_blank" rel="noopener noreferrer">Sign in to English App</a></p>`,
        `<p>If you did not request this, you can ignore this email.</p>`,
      ].join(""),
      text: `Sign in to English App by visiting ${url}`,
    });
  };
}

function createAuthConfig(): NextAuthConfig {
  const env = getEnv();
  const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
  const sendVerificationEmail = createVerificationSender(env, resend);

  return {
    adapter: PrismaAdapter(getPrisma()),
    session: {
      strategy: "database",
    },
    trustHost: true,
    secret: env.AUTH_SECRET,
    providers: [
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      }),
      EmailProvider({
        from: env.EMAIL_FROM,
        server: env.EMAIL_SERVER ?? { jsonTransport: true },
        sendVerificationRequest: async (params) => sendVerificationEmail(params),
      }),
    ],
    pages: {
      signIn: "/login",
      verifyRequest: "/login?status=check-email",
      error: "/login",
    },
    callbacks: {
      authorized: async ({ auth, request }: AuthorizedParams) => {
        const { pathname } = request.nextUrl;

        if (isPublicPath(pathname)) {
          return true;
        }

        if (pathname.startsWith("/api/")) {
          return hasAuthenticatedUser(auth);
        }

        if (pathname.startsWith("/dashboard")) {
          return hasAuthenticatedUser(auth);
        }

        return true;
      },
      session: async ({ session, user }: SessionParams) => {
        if (session.user && user) {
          const adapterUser = user as { id?: string; role?: Role | null };
          if (adapterUser.id) {
            (session.user as SessionUser).id = adapterUser.id;
            (session.user as SessionUser).role = (adapterUser.role as Role) ?? "USER";
          }
        }
        return session;
      },
      jwt: async ({ token, user }: JwtParams) => {
        const enrichedToken = token as JWT & { id?: string; role?: Role };
        if (user) {
          const adapterUser = user as { id?: string; role?: Role | null };
          if (adapterUser.id) {
            enrichedToken.id = adapterUser.id;
            enrichedToken.role = (adapterUser.role as Role) ?? "USER";
          }
        }
        return enrichedToken;
      },
    },
    events: {
      signIn: async ({ user, isNewUser }: SignInParams) => {
        const { logger, metrics } = getObservabilityContext();
        const userId = "id" in user ? (user as { id?: string | null }).id : undefined;
        logger.info("User signed in", { route: "auth.signIn", userId, isNewUser });
        metrics.recordEvent("auth.sign_in");
      },
      signOut: async (message: SignOutParams) => {
        const session =
          "session" in message ? (message.session as { userId?: string | null } | null) : null;
        const token = "token" in message ? (message.token as { id?: string | null } | null) : null;
        const userId =
          (session && typeof session === "object" && "userId" in session
            ? (session as { userId?: string }).userId
            : undefined) ??
          (token && typeof token === "object" && "id" in token
            ? (token as { id?: string }).id
            : undefined);
        const { logger, metrics } = getObservabilityContext();
        logger.info("User signed out", { route: "auth.signOut", userId });
        metrics.recordEvent("auth.sign_out");
      },
    },
  } satisfies NextAuthConfig;
}

function resolveAuthRuntime(): AuthRuntime {
  if (!cachedAuthRuntime) {
    cachedAuthRuntime = NextAuth(createAuthConfig());
  }

  return cachedAuthRuntime;
}

export function getAuthConfig(): NextAuthConfig {
  return createAuthConfig();
}

function bindHandler<K extends keyof AuthRuntime["handlers"]>(
  method: K,
): AuthRuntime["handlers"][K] {
  return ((...args: unknown[]) =>
    (resolveAuthRuntime().handlers[method] as (...innerArgs: unknown[]) => unknown)(
      ...args,
    )) as AuthRuntime["handlers"][K];
}

type AuthMethod = "auth" | "signIn" | "signOut";

function bindAuthMethod<K extends AuthMethod>(method: K): AuthRuntime[K] {
  return ((...args: unknown[]) =>
    (resolveAuthRuntime()[method] as (...innerArgs: unknown[]) => unknown)(
      ...args,
    )) as AuthRuntime[K];
}

export const handlers: AuthRuntime["handlers"] = {
  GET: bindHandler("GET"),
  POST: bindHandler("POST"),
};

export const auth = bindAuthMethod("auth");
export const signIn = bindAuthMethod("signIn");
export const signOut = bindAuthMethod("signOut");
