import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ReviewSection from '@/components/ReviewSection' // <--- Importamos o componente novo

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

  if (!instructor) {
    return <div className="p-8 text-center">Instrutor não encontrado.</div>
  }

  // 2. Busca Avaliações deste Instrutor
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('instructor_id', id)
    .order('created_at', { ascending: false })

  // Calcula média de estrelas
  const averageRating = reviews && reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : 'Novo'

  // Formata Link Zap
  const whatsappLink = instructor.phone 
    ? `https://wa.me/55${instructor.phone.replace(/\D/g, '')}?text=Olá, vi seu perfil no Portal CNH.` 
    : '#'

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/aluno" className="text-gray-500 hover:text-blue-600 mb-6 inline-flex items-center gap-2">
          ← Voltar para a busca
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Cabeçalho Visual */}
          <div className="relative h-48 bg-gradient-to-r from-blue-700 to-blue-900">
             {/* Foto de Perfil sobreposta */}
             <div className="absolute -bottom-12 left-8">
                {instructor.avatar_url ? (
                  <img src={instructor.avatar_url} className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover bg-white" alt={instructor.full_name} />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-md bg-gray-200 flex items-center justify-center text-3xl">👤</div>
                )}
             </div>
          </div>

          <div className="pt-16 pb-8 px-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  {instructor.full_name}
                  {/* Estrelas no Título */}
                  <span className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-sm font-bold border border-yellow-200">
                    ⭐ {averageRating}
                  </span>
                </h1>
                <p className="text-gray-500 mt-1 flex items-center gap-2">
                   📍 {instructor.neighborhood}, {instructor.city}
                   <span className="text-gray-300">|</span>
                   Credencial: {instructor.detran_number}
                </p>
              </div>
              
              <div className="text-right hidden md:block">
                 <div className="text-3xl font-bold text-blue-600">R$ {instructor.price_per_class}</div>
                 <span className="text-xs text-gray-400">por aula prática</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              {/* Coluna Principal: Sobre + Carro + Reviews */}
              <div className="md:col-span-2 space-y-8">
                
                <section>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Sobre o Instrutor</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {instructor.description || 'Sem descrição informada.'}
                  </p>
                </section>

                {instructor.car_photo_url && (
                  <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Veículo de Instrução</h3>
                    <div className="rounded-xl overflow-hidden border border-gray-200">
                      <img src={instructor.car_photo_url} className="w-full h-64 object-cover" alt="Carro da aula" />
                      <div className="bg-gray-50 p-3 text-sm text-gray-600 font-medium text-center">
                         {instructor.vehicle_type === 'Automatico' ? 'Câmbio Automático ⚡' : 'Câmbio Manual 🕹️'} 
                         {instructor.own_vehicle ? ' • Veículo Próprio' : ''}
                      </div>
                    </div>
                  </section>
                )}

                {/* AQUI ENTRA A SEÇÃO DE REVIEWS */}
                <hr className="border-gray-100" />
                <ReviewSection instructorId={id} reviews={reviews || []} />

              </div>

              {/* Coluna Lateral: Contato (Mobile Sticky) */}
              <div className="md:col-span-1">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-4">
                  <div className="md:hidden mb-4 pb-4 border-b border-gray-100">
                    <span className="text-gray-500 text-sm">Valor da aula</span>
                    <div className="text-3xl font-bold text-blue-600">R$ {instructor.price_per_class}</div>
                  </div>

                  <a 
                    href={whatsappLink}
                    target="_blank"
                    className="block w-full bg-green-500 hover:bg-green-600 text-white text-center font-bold py-4 px-4 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 mb-3"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                    Chamar no WhatsApp
                  </a>
                  <p className="text-xs text-center text-gray-400">
                    Combine o pagamento e horário diretamente com o instrutor.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}