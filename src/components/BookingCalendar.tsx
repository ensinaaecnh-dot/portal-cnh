'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function BookingCalendar({ instructorId }: { instructorId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAvailableSlots()
  }, [])

  const fetchAvailableSlots = async () => {
    // Busca apenas horários livres ou pendentes deste aluno
    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('instructor_id', instructorId)
      .eq('status', 'available') // Mostra só o que está livre
      .gte('date_time', new Date().toISOString()) // Só datas futuras
      .order('date_time', { ascending: true })
    
    setSlots(data || [])
  }

  const handleBook = async (slotId: string) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('Faça login para agendar.')
      router.push('/login')
      return
    }

    // Marca como 'pending' e coloca o ID do aluno
    const { error } = await supabase
      .from('schedules')
      .update({ 
        status: 'pending',
        student_id: user.id
      })
      .eq('id', slotId)

    if (error) {
      alert('Erro ao agendar: ' + error.message)
    } else {
      alert('Solicitação enviada! Aguarde o instrutor confirmar.')
      fetchAvailableSlots() // Atualiza a lista (o horário vai sumir pois não é mais 'available')
    }
    setLoading(false)
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 mt-8">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Agendar Aula Prática</h3>
      
      {slots.length === 0 ? (
        <p className="text-gray-500 text-sm">Este instrutor não tem horários livres cadastrados no momento.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {slots.map((slot) => {
             const date = new Date(slot.date_time)
             return (
               <button
                 key={slot.id}
                 disabled={loading}
                 onClick={() => handleBook(slot.id)}
                 className="p-3 rounded border border-blue-100 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition text-center group"
               >
                 <span className="block text-xs text-gray-500 uppercase font-bold mb-1">
                   {date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                 </span>
                 <span className="block text-lg font-bold text-blue-700 group-hover:scale-110 transition-transform">
                   {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                 </span>
                 <span className="text-[10px] text-blue-400 mt-1 block group-hover:text-blue-600">
                   Clique para reservar
                 </span>
               </button>
             )
          })}
        </div>
      )}
    </div>
  )
}