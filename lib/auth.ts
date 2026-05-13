import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'OTP',
      credentials: {
        name:  { label: 'Name',  type: 'text' },
        email: { label: 'Email', type: 'text' },
        phone: { label: 'Phone', type: 'text' },
        otp:   { label: 'OTP',   type: 'text' },
      },
      async authorize(credentials) {
        const otp   = credentials?.otp   as string;
        const name  = credentials?.name  as string;
        const email = (credentials?.email as string)?.trim().toLowerCase();
        const phone = credentials?.phone as string;

        if (!otp || (!email && !phone)) return null;

        const identifier = email || phone;

        const verificationToken = await prisma.verificationToken.findFirst({
          where:   { identifier },
          orderBy: { expires: 'desc' },
        });

        if (!verificationToken) return null;
        if (verificationToken.expires < new Date()) return null;

        // Hash the provided OTP the same way the send route does
        const secret  = process.env['NEXTAUTH_SECRET'] ?? '';
        const enc     = new TextEncoder();
        const data    = enc.encode(otp + secret);
        const hash    = await crypto.subtle.digest('SHA-256', data);
        const hashed  = Buffer.from(hash).toString('hex');

        if (hashed !== verificationToken.token) return null;

        // Invalidate token
        await prisma.verificationToken.deleteMany({ where: { identifier } });

        // Find or create user
        let user = email
          ? await prisma.user.findUnique({ where: { email } })
          : null;

        if (!user && phone) {
          user = await prisma.user.findUnique({ where: { phone } });
        }

        if (!user) {
          user = await prisma.user.create({
            data: {
              phone:  phone  || undefined,
              email:  email  || undefined,
              name:   name   || (phone ? `Farmer ${phone.slice(-4)}` : 'Farmer'),
            },
          });
        } else if (name && !user.name) {
          user = await prisma.user.update({
            where: { id: user.id },
            data:  { name },
          });
        }

        return {
          id:    user.id,
          name:  user.name,
          email: user.email,
          phone: user.phone,
        } as Parameters<typeof CredentialsProvider>[0]['credentials'] extends infer C ? unknown : unknown as never;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id    = (user as { id?: string }).id;
        token.phone = (user as { phone?: string | null }).phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id?: string }).id    = token.id    as string;
        (session.user as { phone?: string | null }).phone = token.phone as string | null;
      }
      return session;
    },
  },
});
