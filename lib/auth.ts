import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import User from '@/models/User'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        await connectDB()

        const user = await User.findOne({ email: credentials.email }).lean()
        if (!user) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!passwordMatch) return null

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          currency: user.currency ?? 'USD',
          monthlyIncomeGoal: user.monthlyIncomeGoal ?? 0,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.currency = user.currency
        token.monthlyIncomeGoal = user.monthlyIncomeGoal
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.currency = token.currency as string
        session.user.monthlyIncomeGoal = token.monthlyIncomeGoal as number
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
