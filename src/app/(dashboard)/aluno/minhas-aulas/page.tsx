import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export default async function MyClassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Faça login para ver suas aulas.</div>
  }

  // Busca aulas confirmadas ou pendentes deste aluno
  const { data: classes } = await supabase
    .from('schedules')
    .select(`
      *,
      instructor:instructors (
        full_name,
        avatar_url,
        phone
      )
    `)
    .eq('student_id', user.id)
    .order('date_time', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-blue-600">Portal CNH</h1>
        <div className="flex items-center gap-4 text-sm">
           <Link href="/aluno" className="text-gray-500 hover:text-blue-600">Buscar Instrutores</Link>
           <span className="text-gray-300">|</span>
           <span className="text-blue-600 font-bold">Minhas Aulas</span>
           <span className="text-gray-300">|</span>
           <LogoutButton />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Minhas Aulas Práticas</h1>
          <Link href="/aluno" className="text-sm text-blue-600 underline">
            + Agendar nova aula
          </Link>
        </div>

        <div className="space-y-4">
          {(!classes || classes.length === 0) && (
            <div className="bg-white p-8 rounded-xl text-center border border-gray-200">
              <p className="text-gray-500 mb-2">Você ainda não agendou nenhuma aula.</p>
              <Link href="/aluno" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm inline-block mt-2">
                Encontrar Instrutor
              </Link>
            </div>
          )}

          {classes?.map((aula: any) => {
            const date = new Date(aula.date_time)
            // Lógica para saber se a aula já passou
            const isPast = new Date() > date

            return (
              <div key={aula.id} className={`p-6 rounded-xl shadow-sm border flex flex-col md:flex-row justify-between items-center gap-4 ${
                isPast ? 'bg-gray-100 border-gray-200 opacity-75' : 'bg-white border-gray-100'
              }`}>
                <div className="flex gap-4 items-center w-full md:w-auto">
                   {/* Foto Instrutor */}
                   <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {aula.instructor?.avatar_url ? (
                        <img src={aula.instructor.avatar_url} className="w-full h-full object-cover" alt="Instrutor" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Foto</div>
                      )}
                   </div>
                   
                   <div>
                      <h3 className="font-bold text-gray-900">{aula.instructor?.full_name || 'Instrutor'}</h3>
                      <p className="text-sm text-gray-500">
                        {date.toLocaleDateString('pt-BR')} às <span className="font-bold text-gray-700">{date.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
                      </p>
                      
                      <div className="mt-1">
                        {aula.status === 'pending' && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold border border-yellow-200">Aguardando Confirmação</span>}
                        {aula.status === 'confirmed' && !isPast && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold border border-green-200">Confirmada</span>}
                        {isPast && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-bold border border-gray-300">Concluída</span>}
                      </div>
                   </div>
                </div>

                <div className="w-full md:w-auto flex justify-end">
                  {aula.status === 'confirmed' ? (
                    <Link href={`/chat/${aula.id}`} className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors">
                       💬 Abrir Chat
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-400 italic px-2">Chat bloqueado</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}