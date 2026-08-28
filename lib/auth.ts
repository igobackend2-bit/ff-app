import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/db';
import { getProfileName, saveProfileName } from '@/lib/user-profile';

export const AUTH_SECRET = process.env['AUTH_SECRET'] ?? process.env['NEXTAUTH_SECRET'] ?? 'ff-dev-secret';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  secret: AUTH_SECRET,
  trustHost: true,
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'OTP',
      credentials: {
        name:     { label: 'Name',  type: 'text' },
        email:    { label: 'Email', type: 'text' },
        phone:    { label: 'Phone', type: 'text' },
        otp:      { label: 'OTP',   type: 'text' },
        otpToken: { label: 'OTP Token', type: 'text' },
      },
      async authorize(credentials) {
        const otp      = credentials?.otp   as string;
        const name     = credentials?.name  as string;
        const email    = (credentials?.email as string)?.trim().toLowerCase();
        const phone    = credentials?.phone as string;
        const otpToken = credentials?.otpToken as string | undefined;

        if (!otp || (!email && !phone)) return null;

        const identifier = email || phone;
        const secret = process.env['NEXTAUTH_SECRET'] ?? 'ff-dev-secret';
        let verified = false;

        // ── 1. Stateless signed token (works without DB) ───────────────────
        if (otpToken && phone) {
          try {
            const decoded = Buffer.from(otpToken, 'base64url').toString();
            const [tokPhone, expStr, signature] = decoded.split('|');
            const expires = Number(expStr);
            if (tokPhone === phone && expires > Date.now() && signature) {
              const sigInput = `${phone}|${otp}|${expires}|${secret}`;
              const sigHash  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sigInput));
              const expected = Buffer.from(sigHash).toString('hex');
              if (expected === signature) verified = true;
            }
          } catch { /* fall through to DB check */ }
        }

        // ── 2. DB-stored token (legacy path) ───────────────────────────────
        if (!verified) {
          try {
            const verificationToken = await prisma.verificationToken.findFirst({
              where:   { identifier },
              orderBy: { expires: 'desc' },
            });
            if (!verificationToken || verificationToken.expires < new Date()) return null;

            const data   = new TextEncoder().encode(otp + secret);
            const hash   = await crypto.subtle.digest('SHA-256', data);
            const hashed = Buffer.from(hash).toString('hex');
            if (hashed !== verificationToken.token) return null;

            await prisma.verificationToken.deleteMany({ where: { identifier } });
            verified = true;
          } catch {
            return null; // no stateless token and DB down — cannot verify
          }
        }

        if (!verified) return null;

        // ── 3. Phone flow: deterministic identity, no DB writes ────────────
        // The customer Postgres (Prisma) is intentionally offline in prod, and
        // touching it here risked minting a fresh cuid() on every login — a new
        // "account" each time. One phone number == one stable id, always.
        if (phone) {
          // Recover the name saved for this phone (profile edit / checkout /
          // previous signup) so returning users keep their name & history.
          let resolvedName = name?.trim() || '';
          if (!resolvedName) {
            resolvedName = (await getProfileName(phone).catch(() => null)) ?? '';
          } else {
            // First-time or updated name — persist it for next login.
            void saveProfileName(phone, resolvedName);
          }
          return {
            id:    `phone:${phone}`,
            name:  resolvedName || `Farmer ${phone.slice(-4)}`,
            email: null,
            phone,
          };
        }

        // ── Email flow (unchanged) — JWT-only fallback when DB is down ─────
        const fallbackName = name || 'Farmer';
        try {
          let user = email
            ? await prisma.user.findUnique({ where: { email } })
            : null;

          if (!user) {
            user = await prisma.user.create({
              data: { email: email || undefined, name: fallbackName },
            });
          } else if (name && !user.name) {
            user = await prisma.user.update({
              where: { id: user.id },
              data:  { name },
            });
          }

          return { id: user.id, name: user.name, email: user.email, phone: user.phone };
        } catch (dbErr) {
          console.warn('[auth] DB unavailable — issuing JWT-only session:', String(dbErr).slice(0, 200));
          return {
            id:    email ? `email:${email}` : 'anon',
            name:  fallbackName,
            email: email || null,
            phone: null,
          };
        }
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
