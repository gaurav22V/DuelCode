import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "DuelCode",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const res = await fetch("http://localhost:8000/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password
            })
          });
          const data = await res.json();
          if (res.ok && data) {
            return { id: credentials.username, name: credentials.username };
          }
          return null;
        } catch (e) {
          return null;
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    // THIS IS THE MAGIC INTERCEPTOR
    async signIn({ user, account }) {
      if (account.provider === "google") {
        try {
          const res = await fetch(`http://localhost:8000/auth/check-email?email=${user.email}`);
          const data = await res.json();

          if (data.exists) {
            // User already has an account. Swap Google's ID for their DuelCode username!
            user.id = data.username;
            user.name = data.username;
            return true; 
          } else {
            // New user! Redirect them to choose a username.
            return `/complete-signup?email=${user.email}`;
          }
        } catch (error) {
          console.error("Backend connection failed", error);
          return false;
        }
      }
      return true; // Let Credentials logins pass through normally
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub;
        session.user.name = token.name;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
