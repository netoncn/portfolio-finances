import type { DefaultSession, NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith("https://"),

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  // Debug apenas em desenvolvimento
  debug:
    process.env.NEXTAUTH_DEBUG === "true" &&
    process.env.NODE_ENV !== "production",

  callbacks: {
    async signIn({ user, account, profile }) {
      if (process.env.NEXTAUTH_DEBUG === "true") {
        console.log("========== SIGNIN CALLBACK ==========");
        console.log("User:", user);
        console.log("Account:", account);
        console.log("Profile:", profile);
        console.log("=====================================");
      }
      return true;
    },

    async jwt({ token, user, account, profile }) {
      if (process.env.NEXTAUTH_DEBUG === "true") {
        console.log("========== JWT CALLBACK ==========");
        console.log("Token:", token);
        console.log("User:", user);
        console.log("==================================");
      }

      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (process.env.NEXTAUTH_DEBUG === "true") {
        console.log("========== SESSION CALLBACK ==========");
        console.log("Session:", session);
        console.log("Token:", token);
        console.log("======================================");
      }

      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (process.env.NEXTAUTH_DEBUG === "true") {
        console.log("========== REDIRECT CALLBACK ==========");
        console.log("URL solicitada:", url);
        console.log("Base URL:", baseUrl);
      }

      if (url.startsWith("/")) {
        process.env.NEXTAUTH_DEBUG === "true" &&
          console.log("Redirect relativo:", `${baseUrl}${url}`);
        return `${baseUrl}${url}`;
      }

      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);

        if (urlObj.origin === baseUrlObj.origin) {
          process.env.NEXTAUTH_DEBUG === "true" &&
            console.log("Redirect mesma origem:", url);
          return url;
        }
      } catch (error) {
        console.error("Erro ao parsear URL:", error);
      }

      process.env.NEXTAUTH_DEBUG === "true" &&
        console.log("Redirect para baseUrl:", baseUrl);
      return baseUrl;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? `__Secure-next-auth.session-token`
          : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};
