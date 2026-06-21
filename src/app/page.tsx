import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import ResizeTool from '@/components/ResizeTool'

export default async function Home() {
  const session = await getSession()
  if (!session.isLoggedIn || !session.userId) redirect('/login')

  await connectDB()
  const user = await User.findById(session.userId).select('-password')
  if (!user) redirect('/login')

  return (
    <ResizeTool
      initialCredits={user.credits}
      email={user.email}
    />
  )
}
