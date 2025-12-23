import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatWindow from '@/components/ChatWindow'
import Link from 'next/link'

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verifica se a aula existe e pega detalhes
  const { data: schedule } = await supabase
    .from('schedules')
    .select('*, instructor:instructors(full_name)') // Pega nome do instrutor
    .eq('id', id)
    .single()

  if (!schedule) return <div>Aula não encontrada.</div>

  const date = new Date(schedule.date_time)
  const dateStr = date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/aluno/minhas-aulas" className="text-sm text-gray-500 hover:text-blue-600">← Voltar</Link>
          <h1 className="font-bold text-gray-800">Chat da Aula</h1>
        </div>

        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-blue-800">Aula com {schedule.instructor.full_name}</h2>
          <p className="text-gray-600">📅 {dateStr}</p>
          <p className="text-xs text-green-600 font-bold uppercase mt-1">✅ Confirmada</p>
        </div>

        {/* Componente do Chat */}
        <ChatWindow scheduleId={id} currentUserId={user.id} />
      </div>
    </div>
  )
}