import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'OTP',
      credentials: {
        name: { label: 'Name', type: 'text' },
        email: { label: 'Email', type: 'text' },
        phone: { label: 'Phone', type: 'text' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp || !credentials?.email || !credentials?.name) return null;

        const name = credentials.name as string;
        const email = credentials.email as string;
        const phone = credentials.phone as string;
        const otp = credentials.otp as string;

        // 1. Get token from DB using email as identifier
        const verificationToken = await prisma.verificationToken.findFirst({
          where: { identifier: email },
          orderBy: { expires: 'desc' },
        });

        if (!verificationToken || verificationToken.expires < new Date()) {
          return null;
        }

        // 2. Verify OTP hash
        const encoder = new TextEncoder();
        const data = encoder.encode(otp + (process.env['NEXTAUTH_SECRET'] ?? ''));
        const hash = await crypto.subtle.digest('SHA-256', data);
        const hashedOtp = Buffer.from(hash).toString('hex');

        if (hashedOtp !== verificationToken.token) {
          return null;
        }

        // 3. Delete token
        await prisma.verificationToken.deleteMany({
          where: { identifier: email },
        });

        // 4. Find or create user
        let user = await prisma.user.findUnique({
          where: { phone },
        });

        if (!user) {
          // If not found by phone, check by email
          user = await prisma.user.findUnique({
            where: { email },
          });
        }

        if (!user) {
          user = await prisma.user.create({
            data: {
              phone,
              email,
              name,
            },
          });
        } else {
          // Update user's email and name if missing
          if (!user.email || !user.name || user.name.startsWith('Farmer ')) {
             user = await prisma.user.update({
               where: { id: user.id },
               data: {
                 email: user.email || email,
                 name: user.name?.startsWith('Farmer ') ? name : user.name,
               }
             });
          }
        }

        return {
          id: user.id,
          name: user.name,
          phone: user.phone,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
});
