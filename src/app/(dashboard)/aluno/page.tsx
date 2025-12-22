import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AlunoDashboard() {
  const supabase = await createClient()

  // 1. Verifica usuario
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Busca perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 3. Busca as aulas do banco de dados!
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Portal CNH</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Olá, <strong>{profile?.full_name}</strong></span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">
            {profile?.role?.toUpperCase()}
          </span>
        </div>
      </nav>

      <main className="container mx-auto p-6 max-w-5xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Minhas Aulas</h2>
          <p className="text-gray-500">Assista aos módulos obrigatórios para liberar sua prova.</p>
        </div>

        <div className="grid gap-4">
          {lessons?.map((lesson) => (
            <div key={lesson.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition">
              <div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {lesson.module}
                </span>
                <h3 className="text-lg font-semibold text-gray-800 mt-2">{lesson.title}</h3>
                <p className="text-sm text-gray-500">{lesson.description}</p>
              </div>
              <div className="text-right">
                <span className="block text-xs text-gray-400 mb-2">{lesson.duration} min</span>
                <button className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700">
                  Assistir
                </button>
              </div>
            </div>
          ))}

          {lessons?.length === 0 && (
            <p className="text-center text-gray-500 py-10">Nenhuma aula encontrada.</p>
          )}
        </div>
      </main>
    </div>
  )
}