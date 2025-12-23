'use client' // <--- Mudamos para Client Component para poder abrir o modal

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import ReviewModal from '@/components/ReviewModal'

export default function MyClassesPage() {
  const supabase = createClient()
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  // Controle do Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      // Busca aulas + instrutor + se já existe review para aquela aula
      const { data } = await supabase
        .from('schedules')
        .select(`
          *,
          instructor:instructors (
            id,
            full_name,
            avatar_url,
            phone
          ),
          review:reviews(id) 
        `)
        .eq('student_id', user.id)
        .order('date_time', { ascending: true })

      setClasses(data || [])
      setLoading(false)
    }
    loadData()
  }, [])

  const handleOpenReview = (aula: any) => {
    setSelectedClass(aula)
    setReviewModalOpen(true)
  }

  if (loading) return <div className="p-8 text-center">Carregando suas aulas...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-blue-600">Portal CNH</h1>
        <div className="flex items-center gap-4 text-sm">
           <Link href="/aluno" className="text-gray-500 hover:text-blue-600">Buscar Instrutores</Link>
           <span className="text-gray-300">|</span>
           <span className="text-blue-600 font-bold">Minhas Aulas</span>
           <span className="text-gray-300">|</span>
           <LogoutButton />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Minhas Aulas Práticas</h1>
          <Link href="/aluno" className="text-sm text-blue-600 underline">
            + Agendar nova aula
          </Link>
        </div>

        <div className="space-y-4">
          {classes.length === 0 && (
            <div className="bg-white p-8 rounded-xl text-center border border-gray-200">
              <p className="text-gray-500 mb-2">Você ainda não agendou nenhuma aula.</p>
              <Link href="/aluno" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm inline-block mt-2">
                Encontrar Instrutor
              </Link>
            </div>
          )}

          {classes.map((aula) => {
            const date = new Date(aula.date_time)
            const isPast = new Date() > date
            const hasReview = aula.review && aula.review.length > 0

            return (
              <div key={aula.id} className={`p-6 rounded-xl shadow-sm border flex flex-col md:flex-row justify-between items-center gap-4 ${
                isPast ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'
              }`}>
                <div className="flex gap-4 items-center w-full md:w-auto">
                   <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {aula.instructor?.avatar_url ? (
                        <img src={aula.instructor.avatar_url} className="w-full h-full object-cover" alt="Instrutor" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Foto</div>
                      )}
                   </div>
                   
                   <div>
                      <h3 className="font-bold text-gray-900">{aula.instructor?.full_name || 'Instrutor'}</h3>
                      <p className="text-sm text-gray-500">
                        {date.toLocaleDateString('pt-BR')} às <span className="font-bold text-gray-700">{date.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
                      </p>
                      
                      <div className="mt-1 flex gap-2">
                        {aula.status === 'pending' && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold border border-yellow-200">Aguardando</span>}
                        {aula.status === 'confirmed' && !isPast && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold border border-green-200">Confirmada</span>}
                        {isPast && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-bold border border-gray-300">Concluída</span>}
                      </div>
                   </div>
                </div>

                <div className="w-full md:w-auto flex justify-end gap-2">
                  
                  {/* BOTÃO DE CHAT (Se não passou e está confirmada) */}
                  {aula.status === 'confirmed' && !isPast && (
                    <Link href={`/chat/${aula.id}`} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 text-sm flex items-center gap-2">
                       💬 Chat
                    </Link>
                  )}

                  {/* BOTÃO DE AVALIAR (Se já passou, confirmada e SEM review) */}
                  {aula.status === 'confirmed' && isPast && !hasReview && (
                    <button 
                      onClick={() => handleOpenReview(aula)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-yellow-600 text-sm shadow-sm flex items-center gap-1"
                    >
                       ⭐ Avaliar Aula
                    </button>
                  )}

                  {/* AVISO SE JÁ AVALIOU */}
                  {hasReview && (
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-2 rounded border border-gray-200">
                      ★ Aula Avaliada
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL DE AVALIAÇÃO */}
      {reviewModalOpen && selectedClass && user && (
        <ReviewModal 
          scheduleId={selectedClass.id}
          instructorId={selectedClass.instructor.id}
          studentId={user.id}
          onClose={() => {
            setReviewModalOpen(false)
            window.location.reload() // Recarrega para atualizar o status
          }}
        />
      )}
    </div>
  )
}