'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AdminActions({ instructorId }: { instructorId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleStatus = async (status: 'approved' | 'rejected') => {
    if (!confirm(`Tem certeza que deseja mudar para ${status}?`)) return
    
    setLoading(true)
    const { error } = await supabase
      .from('instructors')
      .update({ status })
      .eq('id', instructorId)

    if (error) {
      alert('Erro: ' + error.message)
    } else {
      router.refresh() // Atualiza a lista na hora
    }
    setLoading(false)
  }

  return (
    <>
      <button 
        onClick={() => handleStatus('approved')}
        disabled={loading}
        className="bg-green-600 text-white py-2 px-4 rounded font-bold hover:bg-green-700 transition disabled:opacity-50"
      >
        Aprovar
      </button>
      <button 
        onClick={() => handleStatus('rejected')}
        disabled={loading}
        className="bg-red-100 text-red-600 py-2 px-4 rounded font-bold hover:bg-red-200 transition disabled:opacity-50"
      >
        Rejeitar
      </button>
    </>
  )
}