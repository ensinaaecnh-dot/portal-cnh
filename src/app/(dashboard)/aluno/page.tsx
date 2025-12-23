import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link' // <--- Importante para o link funcionar
import SearchBar from '@/components/SearchBar'
import LogoutButton from '@/components/LogoutButton'

export default async function AlunoDashboard({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const query = params.q || ''
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

  // 3. Busca Instrutores
  let supabaseQuery = supabase
    .from('instructors')
    .select('*')
    .eq('status', 'approved') 
    .order('created_at', { ascending: false })

  if (query) {
    supabaseQuery = supabaseQuery.or(`city.ilike.%${query}%,neighborhood.ilike.%${query}%`)
  }

  const { data: instructors } = await supabaseQuery

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* NAVBAR COM O LINK MINHAS AULAS */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-blue-600">Portal CNH</h1>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {/* O LINK QUE FALTAVA 👇 */}
          <Link href="/aluno/minhas-aulas" className="text-blue-600 font-bold hover:underline">
            Minhas Aulas
          </Link>
          <span className="text-gray-300">|</span>
          
          <span className="hidden md:inline">Olá, <strong>{profile?.full_name}</strong></span>
          <span className="hidden md:inline text-gray-300">|</span>
          <LogoutButton />
        </div>
      </nav>

      <main className="container mx-auto p-6 max-w-5xl">
        
        {/* AVISO DE SEGURANÇA */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r shadow-sm">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Dica de Segurança:</strong> Nunca faça pagamentos antecipados sem conhecer o instrutor.
                Utilize o chat para combinar o local de encontro.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-800">Encontre seu Instrutor</h2>
          <SearchBar />
        </div>

        {query && instructors?.length === 0 && (
          <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-100 mb-6">
            <p className="text-yellow-800">Nenhum instrutor encontrado para <strong>"{query}"</strong>.</p>
            <Link href="/aluno" className="text-blue-600 underline text-sm mt-2 inline-block">Limpar busca</Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instructors?.map((inst) => (
            <div key={inst.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition duration-200 flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{inst.full_name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      📍 {inst.neighborhood}, {inst.city}
                    </p>
                  </div>
                </div>

                {/* DADOS DA CREDENCIAL */}
                <div className="bg-gray-50 p-3 rounded-lg mb-4 border border-gray-200">
                  <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Credencial Detran</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-800 font-mono font-medium">{inst.detran_number}</span>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold border border-green-200">
                      INFORMADA
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 block mt-1">UF Emissor: {inst.detran_state}</span>
                </div>

                <div className="flex gap-2 mb-4">
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded border border-blue-100">
                    Cat. {inst.cnh_category || 'B'}
                  </span>
                  {inst.own_vehicle && (
                    <span className="bg-purple-50 text-purple-700 text-xs font-bold px-2 py-1 rounded border border-purple-100">
                      Carro Próprio
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {inst.description}
                </p>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block">Valor aula</span>
                  <span className="text-xl font-bold text-blue-600">R$ {inst.price_per_class}</span>
                </div>
                <Link href={`/aluno/instrutor/${inst.id}`} className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                  Ver Perfil
                </Link>
              </div>
            </div>
          ))}

          {!query && instructors?.length === 0 && (
            <div className="col-span-3 text-center py-12 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700">Lista em atualização</h3>
              <p className="text-gray-500 text-sm mt-2">Novos instrutores estão sendo cadastrados.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}