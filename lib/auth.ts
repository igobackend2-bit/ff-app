import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';
const sbHeaders = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function sbGet(table: string, query: string) {
  const res = await fetch(`${SB}/rest/v1/${table}?${query}&limit=1`, { headers: sbHeaders, cache: 'no-store' });
  const rows: any[] = await res.json();
  return rows[0] ?? null;
}
async function sbPost(table: string, body: object) {
  const res = await fetch(`${SB}/rest/v1/${table}`, {
    method: 'POST', headers: { ...sbHeaders, Prefer: 'return=representation' }, body: JSON.stringify(body),
  });
  const rows: any[] = await res.json();
  return rows[0] ?? null;
}
async function sbPatch(table: string, query: string, body: object) {
  await fetch(`${SB}/rest/v1/${table}?${query}`, {
    method: 'PATCH', headers: { ...sbHeaders, Prefer: 'return=minimal' }, body: JSON.stringify(body),
  });
}
async function sbDelete(table: string, query: string) {
  await fetch(`${SB}/rest/v1/${table}?${query}`, { method: 'DELETE', headers: sbHeaders });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
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

        // Look up verification token
        const vt = await sbGet('verification_tokens', `identifier=eq.${encodeURIComponent(identifier)}&order=expires.desc`);
        if (!vt) return null;
        if (new Date(vt.expires) < new Date()) return null;

        // Hash the OTP
        const secret = process.env['NEXTAUTH_SECRET'] ?? '';
        const enc = new TextEncoder();
        const hashBuf = await crypto.subtle.digest('SHA-256', enc.encode(otp + secret));
        const hashed = Buffer.from(hashBuf).toString('hex');

        if (hashed !== vt.token) return null;

        // Invalidate token
        await sbDelete('verification_tokens', `identifier=eq.${encodeURIComponent(identifier)}`);

        // Find or create user
        let user = email ? await sbGet('users', `email=eq.${encodeURIComponent(email)}`) : null;
        if (!user && phone) user = await sbGet('users', `phone=eq.${encodeURIComponent(phone)}`);

        if (!user) {
          user = await sbPost('users', {
            phone: phone || null,
            email: email || null,
            name: name || (phone ? `Farmer ${phone.slice(-4)}` : 'Farmer'),
          });
        } else if (name && !user.name) {
          await sbPatch('users', `id=eq.${user.id}`, { name });
          user = { ...user, name };
        }

        if (!user) return null;

        return { id: user.id, name: user.name, email: user.email, phone: user.phone } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id    = (user as any).id;
        token.phone = (user as any).phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id    = token.id;
        (session.user as any).phone = token.phone;
      }
      return session;
    },
  },
});
