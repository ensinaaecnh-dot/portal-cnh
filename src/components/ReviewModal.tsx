'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ReviewModalProps {
  scheduleId: string
  instructorId: string
  studentId: string
  onClose: () => void
}

export default function ReviewModal({ scheduleId, instructorId, studentId, onClose }: ReviewModalProps) {
  const supabase = createClient()
  const router = useRouter()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase.from('reviews').insert({
      schedule_id: scheduleId,
      instructor_id: instructorId,
      student_id: studentId,
      rating,
      comment
    })

    if (error) {
      alert('Erro ao avaliar: ' + error.message)
      setSaving(false)
    } else {
      alert('Avaliação enviada com sucesso! ⭐')
      router.refresh()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
          <h3 className="font-bold text-lg">Como foi sua aula?</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Estrelas */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-4xl transition-transform hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
              >
                ★
              </button>
            ))}
          </div>
          <p className="text-center font-bold text-gray-700">
            {rating === 5 ? 'Excelente!' : rating === 4 ? 'Muito bom' : rating === 3 ? 'Bom' : rating === 2 ? 'Ruim' : 'Péssimo'}
          </p>

          {/* Comentário */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comentário (Opcional)</label>
            <textarea
              rows={3}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="O instrutor foi pontual? Ensinou bem?"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Enviando...' : 'Enviar Avaliação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}