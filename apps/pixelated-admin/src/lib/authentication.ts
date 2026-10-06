import type { Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getGoogleOAuthCredentials, getNextAuthCredentials } from '@pixelated-tech/components/adminserver';

const nextAuthCfg = getNextAuthCredentials();
const googleCfg = getGoogleOAuthCredentials();

const googleProvider = GoogleProvider({
	clientId: googleCfg.clientId,
	clientSecret: googleCfg.clientSecret,
	authorization: { params: { scope: 'openid email profile' } },
});
(googleProvider as any).clientId = googleCfg.clientId;
(googleProvider as any).clientSecret = googleCfg.clientSecret;

export const authOptions: NextAuthOptions = {
	secret: nextAuthCfg.secret,
	providers: [googleProvider],
	pages: {
		signIn: '/login',
		error: '/login',
	},
	session: {
		strategy: 'jwt',
		maxAge: 24 * 60 * 60,
	},
	callbacks: {
		async jwt({ token, account }: { token: JWT; account?: any }) {
			if (account?.access_token) {
				(token as any).accessToken = account.access_token;
			}
			return token;
		},
		async session({ session, token }: { session: Session; token: JWT }) {
			if ((token as any).accessToken) {
				(session as any).accessToken = (token as any).accessToken;
			}
			return session;
		},
		async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
			if (url.startsWith(baseUrl)) return url;
			if (url.startsWith('/')) return `${baseUrl}${url}`;
			return baseUrl;
		},
	},
};
