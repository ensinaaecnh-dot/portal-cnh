'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh() // Limpa o cache atual
    router.push('/login') // Manda para o login
  }

  return (
    <button 
      onClick={handleLogout} 
      className="text-sm font-medium text-red-600 hover:text-red-800 hover:underline transition-colors"
    >
      Sair da conta
    </button>
  )
}