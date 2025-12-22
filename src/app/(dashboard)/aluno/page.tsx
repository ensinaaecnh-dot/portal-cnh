import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SearchBar from '@/components/SearchBar' // Importamos o componente novo

// O Next.js nos dá acesso aos parametros de busca (searchParams)
export default async function AlunoDashboard({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const query = params.q || '' // Pega o termo de busca ou vazio
  const supabase = await createClient()

  // 1. Verifica quem está logado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Busca perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 3. Monta a busca no banco
  let supabaseQuery = supabase
    .from('instructors')
    .select('*')
    .order('created_at', { ascending: false })

  // SE tiver algo escrito na busca, filtra por Cidade OU Bairro
  if (query) {
    supabaseQuery = supabaseQuery.or(`city.ilike.%${query}%,neighborhood.ilike.%${query}%`)
  }

  const { data: instructors } = await supabaseQuery

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-blue-600">Portal CNH</h1>
        <div className="text-sm text-gray-600">
          Olá, <strong>{profile?.full_name}</strong>
        </div>
      </nav>

      <main className="container mx-auto p-6 max-w-5xl">
        <div className="mb-8 text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-800">Encontre seu Instrutor</h2>
          <p className="text-gray-500">Busque profissionais credenciados perto de você</p>
          
          {/* Aqui entra o componente que criamos */}
          <SearchBar />
        </div>

        {/* Mostra mensagem se estiver buscando e não achar nada */}
        {query && instructors?.length === 0 && (
          <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-100 mb-6">
            <p className="text-yellow-800">
              Nenhum instrutor encontrado para <strong>"{query}"</strong>.
            </p>
            <Link href="/aluno" className="text-blue-600 underline text-sm mt-2 inline-block">
              Limpar busca
            </Link>
          </div>
        )}

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
                  
                  <Link 
                    href={`/aluno/instrutor/${inst.id}`}
                    className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Ver Detalhes
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Se não tiver busca e a lista estiver vazia */}
          {!query && instructors?.length === 0 && (
            <div className="col-span-3 text-center py-10 text-gray-500">
              Nenhum instrutor cadastrado ainda.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}