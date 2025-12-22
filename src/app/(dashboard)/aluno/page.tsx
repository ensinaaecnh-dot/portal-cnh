import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SearchBar from '@/components/SearchBar'

export default async function AlunoDashboard({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const query = params.q || ''
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

  // 3. Monta a busca no banco (AGORA COM FILTRO DE SEGURANÇA)
  let supabaseQuery = supabase
    .from('instructors')
    .select('*')
    .eq('verification_status', 'aprovado') // <--- SÓ MOSTRA APROVADOS
    .order('created_at', { ascending: false })

  // Se tiver busca digitada, filtra também por texto
  if (query) {
    supabaseQuery = supabaseQuery.or(`city.ilike.%${query}%,neighborhood.ilike.%${query}%`)
  }

  const { data: instructors } = await supabaseQuery

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
        <div className="mb-8 text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-800">Encontre seu Instrutor</h2>
          <p className="text-gray-500">Profissionais verificados e credenciados pelo Detran</p>
          
          <SearchBar />
        </div>

        {/* Mensagem se não achar nada na busca */}
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

        {/* Lista de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instructors?.map((inst) => (
            <div key={inst.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition duration-200 flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    {/* NOME + SELO DE VERIFICADO */}
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-1">
                      {inst.full_name}
                      <span className="text-blue-500" title="Verificado pelo Detran">
                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </h3>
                    
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      📍 {inst.neighborhood}, {inst.city}
                    </p>
                  </div>
                </div>

                {/* Badges de Categoria */}
                <div className="flex gap-2 mb-4">
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">
                    CNH {inst.cnh_category || 'B'}
                  </span>
                  {inst.own_vehicle && (
                    <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded">
                      Carro Próprio
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {inst.description}
                </p>
              </div>

              {/* Rodapé do Card */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block">Valor aula</span>
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
          ))}

          {/* Se a lista estiver vazia (porque ninguém foi aprovado ainda) */}
          {!query && instructors?.length === 0 && (
            <div className="col-span-3 text-center py-12 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700">Nenhum instrutor disponível no momento</h3>
              <p className="text-gray-500 text-sm mt-2">
                Estamos validando novos profissionais. Tente novamente mais tarde.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}