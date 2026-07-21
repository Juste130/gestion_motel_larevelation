import { NextAuthOptions, Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import { verifyOtp } from "./otp";
import 'dotenv/config';

// Extend next-auth types to include role and id
declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      id?: string;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id?: string;
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // Étape 2 de la connexion : le mot de passe a déjà été vérifié par
    // requestLoginOtp() (server action) avant que ce provider ne soit appelé.
    // Ici on ne vérifie plus que le code OTP reçu par e-mail.
    CredentialsProvider({
      name: "Code de connexion",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.code) {
          return null;
        }

        const isCodeValid = await verifyOtp(credentials.email, credentials.code, "LOGIN");
        if (!isCodeValid) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // Refuse toute connexion Google dont l'e-mail ne correspond à aucun
    // compte déjà créé/invité par l'admin/DG via la page "Équipe".
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        const existing = await prisma.user.findUnique({ where: { email: user.email } });
        if (!existing) return false;

        // Compte encore en attente d'activation : Google prouve la propriété
        // de l'e-mail, on active donc directement le compte avec cette méthode.
        if (existing.status === "PENDING") {
          await prisma.user.update({
            where: { id: existing.id },
            data: { status: "ACTIVE", authMethod: "GOOGLE" },
          });
          return true;
        }

        // Compte déjà activé avec un mot de passe : une méthode par compte,
        // choisie une fois pour toutes — on refuse et on renvoie vers /login.
        if (existing.authMethod === "CREDENTIALS") return false;
      }
      return true;
    },
    async jwt({ token, user, account }: { token: JWT; user?: User; account?: { provider: string } | null }) {
      if (user) {
        if (account?.provider === "google") {
          const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
          if (dbUser) {
            token.role = dbUser.role;
            token.id = dbUser.id;
          }
        } else {
          token.role = user.role;
          token.id = user.id;
        }
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    }
  }
};