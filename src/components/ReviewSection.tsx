'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ReviewSection({ instructorId, reviews }: { instructorId: string, reviews: any[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [userHasReviewed, setUserHasReviewed] = useState(false) // Controle simples

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return alert('Selecione uma nota de 1 a 5 estrelas!')
    
    setSubmitting(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Faça login para avaliar.')

    const { error } = await supabase.from('reviews').insert({
      instructor_id: instructorId,
      student_id: user.id,
      rating,
      comment
    })

    if (error) {
      alert('Erro ao enviar avaliação: ' + error.message)
    } else {
      setComment('')
      setRating(0)
      setUserHasReviewed(true)
      router.refresh() // Recarrega para mostrar a nova avaliação
    }
    setSubmitting(false)
  }

  // Função para desenhar estrelas
  const StarIcon = ({ filled, onClick }: { filled: boolean, onClick?: () => void }) => (
    <svg 
      onClick={onClick}
      className={`w-6 h-6 cursor-pointer ${filled ? 'text-yellow-400' : 'text-gray-300'}`} 
      fill="currentColor" 
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )

  return (
    <div className="mt-12">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        Avaliações de Alunos
        <span className="text-sm font-normal text-gray-500">({reviews.length})</span>
      </h3>

      {/* Formulário de Avaliação */}
      {!userHasReviewed && (
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8">
          <h4 className="font-bold text-gray-700 mb-3">Avaliar este instrutor</h4>
          <form onSubmit={handleSubmit}>
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon key={star} filled={star <= rating} onClick={() => setRating(star)} />
              ))}
              <span className="ml-2 text-sm text-gray-500 pt-1">
                {rating > 0 ? `${rating} estrelas` : 'Toque para avaliar'}
              </span>
            </div>
            
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte como foi sua experiência com a aula..."
              className="w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
              required
            />
            
            <button 
              type="submit" 
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Publicar Avaliação'}
            </button>
          </form>
        </div>
      )}

      {/* Lista de Avaliações */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-gray-500 italic">Este instrutor ainda não possui avaliações.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} filled={i < review.rating} />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-900">{review.rating}.0</span>
                <span className="text-xs text-gray-400">• {new Date(review.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-700 text-sm mt-2">
                "{review.comment}"
              </p>
              {/* Aqui poderíamos buscar o nome do aluno se quiséssemos, mas por privacidade deixamos anônimo ou buscamos via join */}
              <p className="text-xs text-gray-400 mt-2 font-medium">Aluno Verificado</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}