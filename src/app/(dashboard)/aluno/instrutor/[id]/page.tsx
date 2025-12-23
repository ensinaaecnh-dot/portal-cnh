import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ReviewSection from '@/components/ReviewSection'
import BookingCalendar from '@/components/BookingCalendar' // <--- O componente da agenda
import LogoutButton from '@/components/LogoutButton'

export default async function InstructorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Busca Instrutor
  const { data: instructor } = await supabase
    .from('instructors')
    .select('*')
    .eq('id', id)
    .single()

  if (!instructor) return <div className="p-8 text-center">Instrutor não encontrado.</div>

  // 2. Busca Avaliações
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('instructor_id', id)
    .order('created_at', { ascending: false })

  const averageRating = reviews && reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : 'Novo'

  return (
    <div className="min-h-screen bg-gray-50">
       <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Portal CNH</h1>
        <div className="flex items-center gap-4 text-sm">
           <Link href="/aluno" className="text-gray-500 hover:text-blue-600">Voltar para busca</Link>
           <span className="text-gray-300">|</span>
           <LogoutButton />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Header Azul */}
          <div className="relative h-48 bg-blue-600">
             <div className="absolute -bottom-12 left-8">
                {instructor.avatar_url ? (
                  <img src={instructor.avatar_url} className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover bg-white" />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-md bg-gray-200 flex items-center justify-center text-3xl">👤</div>
                )}
             </div>
          </div>

          <div className="pt-16 pb-8 px-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  {instructor.full_name}
                  <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-sm font-bold border border-yellow-200">
                    ⭐ {averageRating}
                  </span>
                </h1>
                <p className="text-gray-500 mt-1">
                   📍 {instructor.neighborhood}, {instructor.city} | Credencial: {instructor.detran_number}
                </p>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center min-w-[150px]">
                 <div className="text-sm text-gray-500">Valor aula</div>
                 <div className="text-3xl font-bold text-blue-600">R$ {instructor.price_per_class}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
              
              {/* COLUNA PRINCIPAL */}
              <div className="md:col-span-2 space-y-8">
                
                {/* 1. SOBRE */}
                <section>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Sobre o Instrutor</h3>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {instructor.description || 'Sem descrição.'}
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* 2. AGENDA (AQUI ESTÁ O NOVO FOCO) */}
                <section>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-blue-800 mb-2">📅 Agende sua Aula</h3>
                    <p className="text-sm text-blue-600 mb-4">
                      Escolha um horário abaixo para enviar uma solicitação. O chat será liberado após a confirmação.
                    </p>
                    
                    {/* Componente que busca os horários livres */}
                    <BookingCalendar instructorId={id} />
                  </div>
                </section>

                <hr className="border-gray-100" />
                
                {/* 3. AVALIAÇÕES */}
                <ReviewSection instructorId={id} reviews={reviews || []} />
              </div>

              {/* COLUNA LATERAL (FOTO DO CARRO) */}
              <div className="md:col-span-1">
                {instructor.car_photo_url && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky top-6">
                    <h3 className="font-bold text-gray-800 mb-3">Veículo</h3>
                    <img src={instructor.car_photo_url} className="w-full h-48 object-cover rounded-lg mb-2" />
                    <p className="text-center text-sm font-bold text-gray-600">
                      {instructor.vehicle_type} • {instructor.own_vehicle ? 'Próprio' : 'Autoescola'}
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}