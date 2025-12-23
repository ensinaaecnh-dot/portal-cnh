'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
import Link from 'next/link'

export default function InstructorAgenda() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [slots, setSlots] = useState<any[]>([])
  
  // Form de novo horário
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  
  const [instructorId, setInstructorId] = useState<string | null>(null)

  // Carrega agenda
  useEffect(() => {
    const loadAgenda = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      const { data: inst } = await supabase.from('instructors').select('id').eq('user_id', user.id).single()
      if (!inst) return router.push('/instrutor/perfil')
      
      setInstructorId(inst.id)
      fetchSlots(inst.id)
    }
    loadAgenda()
  }, [router, supabase])

  const fetchSlots = async (instId: string) => {
    // Buscamos os horários e tentamos trazer o e-mail do aluno (join com tabela users é complexo no client, 
    // então aqui simplificamos trazendo só o ID, mas num app real faríamos uma query mais elaborada)
    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('instructor_id', instId)
      .order('date_time', { ascending: true })
    
    setSlots(data || [])
    setLoading(false)
  }

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!instructorId || !newDate || !newTime) return

    // Cria data ISO
    const dateTime = new Date(`${newDate}T${newTime}:00`).toISOString()

    const { error } = await supabase.from('schedules').insert({
      instructor_id: instructorId,
      date_time: dateTime,
      status: 'available'
    })

    if (error) alert('Erro: ' + error.message)
    else {
      fetchSlots(instructorId)
      alert('Horário liberado!')
    }
  }

  const changeStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('schedules').update({ status: newStatus }).eq('id', id)
    if (!error) {
      fetchSlots(instructorId!)
    } else {
      alert('Erro ao atualizar: ' + error.message)
    }
  }

  const deleteSlot = async (id: string) => {
    if(!confirm('Apagar este horário?')) return
    await supabase.from('schedules').delete().eq('id', id)
    fetchSlots(instructorId!)
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Portal CNH</h1>
        <div className="flex items-center gap-4 text-sm">
           <Link href="/instrutor/perfil" className="text-gray-500 hover:text-blue-600">Meu Perfil</Link>
           <span className="text-gray-300">|</span>
           <span className="text-blue-600 font-bold">Minha Agenda</span>
           <span className="text-gray-300">|</span>
           <LogoutButton />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Gerenciar Horários</h1>

        {/* Adicionar Horário */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="font-bold text-gray-700 mb-4">Liberar novo horário</h2>
          <form onSubmit={handleAddSlot} className="flex gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">DATA</label>
              <input type="date" required value={newDate} onChange={e => setNewDate(e.target.value)} className="p-2 border rounded" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">HORA</label>
              <input type="time" required value={newTime} onChange={e => setNewTime(e.target.value)} className="p-2 border rounded" />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700">
              + Adicionar
            </button>
          </form>
        </div>

        {/* Lista de Horários */}
        <div className="space-y-3">
          {slots.map((slot) => {
            const date = new Date(slot.date_time)
            return (
              <div key={slot.id} className={`flex flex-col md:flex-row justify-between items-center p-4 rounded-lg border gap-4 ${
                slot.status === 'confirmed' ? 'bg-green-50 border-green-200' :
                slot.status === 'pending' ? 'bg-yellow-50 border-yellow-200' : 'bg-white'
              }`}>
                <div>
                  <div className="font-bold text-lg text-gray-800">
                    {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div className="text-sm mt-1">
                    {slot.status === 'available' && <span className="text-gray-400">Livre (Ninguém reservou)</span>}
                    {slot.status === 'pending' && <span className="text-yellow-700 font-bold">⚠️ Aluno solicitou reserva!</span>}
                    {slot.status === 'confirmed' && <span className="text-green-700 font-bold">✅ Aula Confirmada</span>}
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* Botão de Aceitar (Só aparece se Pendente) */}
                  {slot.status === 'pending' && (
                    <button onClick={() => changeStatus(slot.id, 'confirmed')} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700 shadow-sm">
                      Aceitar Solicitação
                    </button>
                  )}
                  
                  {/* Botão de Chat (Só aparece se Confirmado) */}
                  {slot.status === 'confirmed' && (
                    <Link href={`/chat/${slot.id}`} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-sm">
                      💬 Chat com Aluno
                    </Link>
                  )}

                  {/* Botão de Remover (Não aparece se já confirmou para evitar problemas) */}
                  {slot.status !== 'confirmed' && (
                    <button onClick={() => deleteSlot(slot.id)} className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-2 border border-red-100 rounded hover:bg-red-50">
                      Remover
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          {slots.length === 0 && <p className="text-center text-gray-400 py-8">Nenhum horário na sua agenda.</p>}
        </div>
      </div>
    </div>
  )
}