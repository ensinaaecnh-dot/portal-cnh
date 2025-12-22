import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function InstructorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params // Em Next.js 15, params é uma Promise
  const supabase = await createClient()

  // 1. Busca o instrutor específico pelo ID da URL
  const { data: instructor, error } = await supabase
    .from('instructors')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !instructor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Instrutor não encontrado</h1>
          <Link href="/aluno" className="text-blue-600 hover:underline mt-4 block">
            Voltar para a lista
          </Link>
        </div>
      </div>
    )
  }

  // Formata o link do WhatsApp (Remove caracteres não numéricos)
  const whatsappLink = instructor.phone 
    ? `https://wa.me/55${instructor.phone.replace(/\D/g, '')}?text=Olá, vi seu perfil no Portal CNH e gostaria de saber mais sobre as aulas.` 
    : '#'

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/aluno" className="text-gray-500 hover:text-blue-600 mb-6 inline-flex items-center gap-2">
          ← Voltar para a busca
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Cabeçalho do Perfil */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white">
            <h1 className="text-3xl font-bold">{instructor.full_name}</h1>
            <p className="opacity-90 mt-2 flex items-center gap-2">
              📍 {instructor.neighborhood}, {instructor.city}
            </p>
            <div className="mt-4 inline-flex items-center bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
              Credencial: {instructor.detran_number || 'Não informado'}
            </div>
          </div>

          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8 justify-between">
              
              {/* Coluna da Esquerda: Descrição */}
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Sobre o Instrutor</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {instructor.description || 'Este instrutor ainda não adicionou uma descrição.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="block text-gray-400 text-xs uppercase font-bold">Categoria</span>
                    <span className="text-gray-800 font-medium">Carro (B)</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="block text-gray-400 text-xs uppercase font-bold">Câmbio</span>
                    <span className="text-gray-800 font-medium">Manual e Auto</span>
                  </div>
                </div>
              </div>

              {/* Coluna da Direita: Preço e Ação */}
              <div className="md:w-72 flex-shrink-0">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 sticky top-4">
                  <p className="text-gray-500 text-sm mb-1">Valor por aula prática</p>
                  <div className="text-3xl font-bold text-blue-600 mb-6">
                    R$ {instructor.price_per_class}
                  </div>

                  {instructor.phone ? (
                    <a 
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-green-500 hover:bg-green-600 text-white text-center font-bold py-3 px-4 rounded-lg transition-colors shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                    >
                      <span>Chamar no WhatsApp</span>
                    </a>
                  ) : (
                    <button disabled className="block w-full bg-gray-300 text-gray-500 font-bold py-3 px-4 rounded-lg cursor-not-allowed">
                      Contato indisponível
                    </button>
                  )}
                  
                  <p className="text-xs text-center text-gray-400 mt-4">
                    Pagamento combinado direto com o instrutor.
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