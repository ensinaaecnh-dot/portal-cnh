import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AlunoDashboard() {
  // 1. Conecta no Supabase (Versão Servidor)
  const supabase = await createClient()

  // 2. Verifica quem está logado
  const { data: { user } } = await supabase.auth.getUser()

  // 3. Se não tiver ninguém logado, chuta pro login
  if (!user) {
    redirect('/login')
  }

  // 4. Busca o perfil completo (nome, role, etc)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra Superior Simples */}
      <nav className="bg-white shadow p-4">
        <div className="container mx-auto flex justify-between items-center">
          <span className="font-bold text-xl text-blue-600">Portal CNH</span>
          <div className="text-sm text-gray-600">
            Logado como: <span className="font-semibold">{profile?.full_name || user.email}</span>
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="container mx-auto p-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-4">Painel do Aluno</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-blue-800 font-semibold">Status</h3>
              <p className="text-2xl font-bold text-blue-900">Ativo</p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-green-800 font-semibold">Aulas Concluídas</h3>
              <p className="text-2xl font-bold text-green-900">0 / 20</p>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="text-purple-800 font-semibold">Próxima Aula</h3>
              <p className="text-gray-600">Nenhuma agendada</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Dados da Conta</h2>
            <ul className="space-y-2 text-gray-700">
              <li><strong>ID:</strong> {user.id}</li>
              <li><strong>Email:</strong> {user.email}</li>
              <li><strong>Perfil:</strong> {profile?.role?.toUpperCase()}</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}