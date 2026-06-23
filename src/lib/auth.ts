import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;
        const role = credentials.role as string;

        if (role === "super_admin") {
          const adminEmail = process.env.SUPER_ADMIN_EMAIL;
          const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

          if (email !== adminEmail) return null;
          if (password !== adminPassword) return null;

          return {
            id: "super-admin",
            email: adminEmail,
            name: "Super Admin",
            role: "super_admin",
          };
        }

        const barber = await prisma.barber.findUnique({
          where: { email },
        });

        if (!barber || !barber.isActive) return null;

        const isValid = await bcrypt.compare(password, barber.passwordHash);
        if (!isValid) return null;

        return {
          id: barber.id,
          email: barber.email,
          name: barber.name,
          role: "barber",
          slug: barber.slug,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.slug = (user as any).slug;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).slug = token.slug;
      }
      return session;
    },
  },
  pages: {
    signIn: "/super-admin/login",
  },
  session: {
    strategy: "jwt",
  },
});
