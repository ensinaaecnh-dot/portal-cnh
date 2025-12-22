'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function InstructorAgenda() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [slots, setSlots] = useState<any[]>([])
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [instructorId, setInstructorId] = useState<string | null>(null)

  // Carrega a agenda
  useEffect(() => {
    const loadAgenda = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      // Pega ID do instrutor
      const { data: inst } = await supabase.from('instructors').select('id').eq('user_id', user.id).single()
      if (!inst) return router.push('/instrutor/perfil')
      
      setInstructorId(inst.id)
      fetchSlots(inst.id)
    }
    loadAgenda()
  }, [])

  const fetchSlots = async (instId: string) => {
    // Busca horários e os dados do aluno (se houver)
    const { data } = await supabase
      .from('schedules')
      .select(`
        *,
        student:student_id (
          email
        )
      `)
      .eq('instructor_id', instId)
      .order('date_time', { ascending: true })
    
    // Obs: Normalmente faríamos um join com a tabela profiles para pegar o nome do aluno, 
    // mas por simplicidade vamos usar o email ou ajustar depois.
    setSlots(data || [])
    setLoading(false)
  }

  // 1. CRIAR HORÁRIO LIVRE
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
      alert('Horário liberado na agenda!')
    }
  }

  // 2. CONFIRMAR AULA
  const handleConfirm = async (slotId: string) => {
    const { error } = await supabase
      .from('schedules')
      .update({ status: 'confirmed' })
      .eq('id', slotId)

    if (!error) fetchSlots(instructorId!)
  }

  // 3. EXCLUIR HORÁRIO
  const handleDelete = async (slotId: string) => {
    if(!confirm('Tem certeza?')) return
    const { error } = await supabase.from('schedules').delete().eq('id', slotId)
    if (!error) fetchSlots(instructorId!)
  }

  if (loading) return <div className="p-8 text-center">Carregando agenda...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Gerenciar Minha Agenda</h1>

        {/* Formulário de Adicionar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="font-bold text-gray-700 mb-4">Liberar Novo Horário</h2>
          <form onSubmit={handleAddSlot} className="flex gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Dia</label>
              <input type="date" required value={newDate} onChange={e => setNewDate(e.target.value)} className="p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Hora</label>
              <input type="time" required value={newTime} onChange={e => setNewTime(e.target.value)} className="p-2 border rounded" />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">
              + Adicionar
            </button>
          </form>
        </div>

        {/* Lista de Agendamentos */}
        <div className="space-y-4">
          <h2 className="font-bold text-gray-700">Próximos Horários</h2>
          {slots.length === 0 && <p className="text-gray-400">Nenhum horário cadastrado.</p>}

          {slots.map((slot) => {
            const date = new Date(slot.date_time)
            const formattedDate = date.toLocaleDateString('pt-BR')
            const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

            return (
              <div key={slot.id} className={`p-4 rounded-lg border flex justify-between items-center ${
                slot.status === 'confirmed' ? 'bg-green-50 border-green-200' : 
                slot.status === 'pending' ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'
              }`}>
                <div>
                  <div className="font-bold text-lg text-gray-800">{formattedDate} às {formattedTime}</div>
                  <div className="text-sm mt-1">
                    {slot.status === 'available' && <span className="text-gray-500">Livre (Aguardando aluno)</span>}
                    {slot.status === 'pending' && <span className="text-yellow-700 font-bold">Solicitação de Aluno!</span>}
                    {slot.status === 'confirmed' && <span className="text-green-700 font-bold">Aula Confirmada ✅</span>}
                  </div>
                </div>

                <div className="flex gap-2">
                  {slot.status === 'pending' && (
                    <button onClick={() => handleConfirm(slot.id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-green-700">
                      Aceitar Aula
                    </button>
                  )}
                  <button onClick={() => handleDelete(slot.id)} className="text-red-500 hover:text-red-700 text-sm font-medium border border-red-100 px-3 py-1 rounded hover:bg-red-50">
                    {slot.status === 'available' ? 'Remover' : 'Cancelar'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}