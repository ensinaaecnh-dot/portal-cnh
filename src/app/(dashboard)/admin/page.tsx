import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { checkIsAdmin } from '@/lib/isAdmin'
import AdminActions from './actions' // Vamos criar esse componente logo abaixo

export default async function AdminDashboard() {
  // 1. Segurança: Chuta quem não for admin
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) {
    redirect('/') // Manda de volta pra home se não for você
  }

  const supabase = await createClient()

  // 2. Busca instrutores PENDENTES
  const { data: pendingInstructors } = await supabase
    .from('instructors')
    .select('*')
    .eq('status', 'pending')
    .order('updated_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Painel Administrativo</h1>
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">
            {pendingInstructors?.length || 0} Pendentes
          </div>
        </div>

        {pendingInstructors?.length === 0 ? (
          <div className="bg-white p-12 rounded-xl text-center text-gray-500 shadow-sm">
            <p className="text-xl">Tudo limpo! Nenhum instrutor aguardando aprovação. 🎉</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {pendingInstructors?.map((inst) => (
              <div key={inst.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6">
                
                {/* Coluna das Fotos */}
                <div className="flex gap-4 md:w-1/3">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 mb-1">Perfil</p>
                    {inst.avatar_url ? (
                      <img src={inst.avatar_url} className="w-full h-32 object-cover rounded-lg bg-gray-100" />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-xs">Sem foto</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 mb-1">Carro</p>
                    {inst.car_photo_url ? (
                      <img src={inst.car_photo_url} className="w-full h-32 object-cover rounded-lg bg-gray-100" />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-xs">Sem foto</div>
                    )}
                  </div>
                </div>

                {/* Coluna dos Dados */}
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-bold text-gray-800">{inst.full_name}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <p>📍 {inst.city} - {inst.state}</p>
                    <p>🆔 Credencial: {inst.detran_number} ({inst.detran_state})</p>
                    <p>📞 {inst.phone}</p>
                    <p>💲 R$ {inst.price_per_class}</p>
                    <p>🚗 {inst.vehicle_type} ({inst.own_vehicle ? 'Próprio' : 'Autoescola'})</p>
                    <p>📄 CPF: {inst.cpf}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded text-xs text-gray-500 mt-2 italic">
                    "{inst.description}"
                  </div>
                </div>

                {/* Coluna de Ação (Botões) */}
                <div className="flex flex-col justify-center gap-3 md:w-40 border-l pl-6 border-gray-100">
                  {/* Componente Client-Side para os botões funcionarem */}
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