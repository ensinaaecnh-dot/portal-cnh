import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AlunoDashboard() {
  const supabase = await createClient()

  // 1. Verifica quem está logado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Busca perfil do usuário logado
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 3. Busca os INSTRUTORES disponíveis no banco
  const { data: instructors } = await supabase
    .from('instructors')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-blue-600">Portal CNH</h1>
        <div className="text-sm text-gray-600">
          Olá, <strong>{profile?.full_name}</strong>
        </div>
      </nav>

      <main className="container mx-auto p-6 max-w-5xl">
        {/* Título e Filtro (Visual apenas por enquanto) */}
        <div className="mb-8 text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-800">Encontre seu Instrutor</h2>
          <p className="text-gray-500">Busque profissionais credenciados perto de você</p>
          
          <div className="flex gap-2 max-w-lg mx-auto mt-4">
            <input 
              type="text" 
              placeholder="Digite sua cidade ou bairro..." 
              className="flex-1 p-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
              Buscar
            </button>
          </div>
        </div>

        {/* Lista de Cards de Instrutores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instructors?.map((inst) => (
            <div key={inst.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition duration-200">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{inst.full_name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      📍 {inst.neighborhood}, {inst.city}
                    </p>
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                    Credenciado
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {inst.description}
                </p>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <span className="text-xs text-gray-400 block">Valor por aula</span>
                    <span className="text-xl font-bold text-blue-600">
                      R$ {inst.price_per_class}
                    </span>
                  </div>
                  <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
          ))}

          {instructors?.length === 0 && (
            <div className="col-span-3 text-center py-10 text-gray-500">
              Nenhum instrutor encontrado nesta região.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}