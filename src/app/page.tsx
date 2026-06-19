import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import LogoutButton from '@/components/LogoutButton'

export default async function Home() {
  const session = await getSession()

  if (!session.isLoggedIn || !session.userId) {
    redirect('/login')
  }

  await connectDB()
  const user = await User.findById(session.userId).select('-password')

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Image Resizer</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">{user.email}</span>
          <span className="font-medium">{user.credits} credits</span>
          <LogoutButton />
        </div>
      </header>

      {/* Placeholder — image input form coming in Milestone 3 */}
      <div className="flex items-center justify-center h-[80vh]">
        <p className="text-gray-400">Image upload form coming in Milestone 3.</p>
      </div>
    </main>
  )
}
