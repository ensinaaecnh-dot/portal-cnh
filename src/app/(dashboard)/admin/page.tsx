import { createClient } from '@/lib/supabase/server'
import { checkIsAdmin } from '@/lib/isAdmin'
import AdminActions from './actions'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Verifica se é admin
  const isAdmin = await checkIsAdmin()

  // --- MODO DIAGNÓSTICO (PARA DESCOBRIR O ERRO) ---
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full text-center border border-red-200">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">O sistema de segurança barrou seu acesso.</p>
          
          <div className="bg-gray-50 p-4 rounded text-left text-sm space-y-2 mb-6 border border-gray-200">
            <p><strong>Status do Login:</strong> {user ? '✅ Logado' : '❌ Não Logado'}</p>
            <p><strong>Seu E-mail atual:</strong> <span className="font-mono text-blue-600">{user?.email || 'Nenhum'}</span></p>
            <p className="text-xs text-gray-500 mt-2 border-t pt-2">
              Dica: Copie o e-mail azul acima e cole EXATAMENTE igual dentro do arquivo <code>src/lib/isAdmin.ts</code>.
            </p>
          </div>

          <a href="/" className="text-blue-600 underline hover:text-blue-800">Voltar para Home</a>
        </div>
      </div>
    )
  }
  // --------------------------------------------------

  // Se passou, mostra o painel normal
  const { data: pendingInstructors } = await supabase
    .from('instructors')
    .select('*')
    .eq('status', 'pending')
    .order('updated_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Painel Administrativo</h1>
        
        {/* Aviso de Debug (Pode remover depois) */}
        <div className="bg-green-100 text-green-800 p-2 text-xs rounded mb-4">
          Logado como Admin: {user?.email}
        </div>

        {pendingInstructors?.length === 0 ? (
          <div className="bg-white p-12 rounded-xl text-center text-gray-500 shadow-sm">
            <p className="text-xl">Nenhum instrutor pendente. 🎉</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {pendingInstructors?.map((inst) => (
              <div key={inst.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6">
                 {/* FOTOS */}
                 <div className="flex gap-4 md:w-1/3">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 mb-1">Perfil</p>
                    {inst.avatar_url ? <img src={inst.avatar_url} className="w-full h-32 object-cover rounded" /> : <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-xs">Sem foto</div>}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 mb-1">Carro</p>
                    {inst.car_photo_url ? <img src={inst.car_photo_url} className="w-full h-32 object-cover rounded" /> : <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-xs">Sem foto</div>}
                  </div>
                </div>

                {/* DADOS */}
                <div className="flex-1 space-y-1 text-sm">
                  <h3 className="text-lg font-bold">{inst.full_name}</h3>
                  <p>📍 {inst.city}/{inst.state}</p>
                  <p>🆔 Credencial: {inst.detran_number}</p>
                  <p>📄 CPF: {inst.cpf}</p>
                  <p className="italic text-gray-500 mt-2">"{inst.description}"</p>
                </div>

                {/* BOTÕES */}
                <div className="flex flex-col justify-center gap-2 border-l pl-4">
                   <AdminActions instructorId={inst.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}