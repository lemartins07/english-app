import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import { Resend } from "resend";

import { getObservabilityContext } from "@english-app/observability";

import { prisma } from "../db/client";
import { getEnv } from "../env";

const env = getEnv();

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

async function sendVerificationEmail({ identifier, url }: { identifier: string; url: string }) {
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
}

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/api/health",
  "/api/openapi.json",
  "/api/auth",
  "/_next",
] as const;

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function hasAuthenticatedUser(auth: unknown): boolean {
  if (!auth || typeof auth !== "object") {
    return false;
  }

  if ("user" in auth && Boolean((auth as { user?: unknown }).user)) {
    return true;
  }

  if ("session" in auth) {
    const session = (auth as { session?: { user?: unknown } }).session;
    if (session && typeof session === "object" && "user" in session) {
      return Boolean((session as { user?: unknown }).user);
    }
  }

  return false;
}

type SessionUser = DefaultSession["user"] & {
  id: string;
  role: Role;
};

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
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
    authorized: async ({ auth, request }) => {
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
    session: async ({ session, user }) => {
      if (session.user) {
        (session.user as SessionUser).id = user.id;
        (session.user as SessionUser).role = (user.role as Role) ?? "USER";
      }
      return session;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = (user.role as Role) ?? "USER";
      }
      return token;
    },
  },
  events: {
    signIn: async ({ user, isNewUser }) => {
      const { logger, metrics } = getObservabilityContext();
      logger.info("User signed in", { route: "auth.signIn", userId: user.id, isNewUser });
      metrics.recordEvent("auth.sign_in");
    },
    signOut: async (message) => {
      const session = "session" in message ? message.session : null;
      const token = "token" in message ? message.token : null;
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
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
