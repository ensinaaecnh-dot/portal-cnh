'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function SearchBar() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Pega o valor que já está na URL (se houver) para manter no input
  const [term, setTerm] = useState(searchParams.get('q') || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault() // Evita recarregar a página
    
    if (term.trim()) {
      // Se tem texto, manda para a URL: /aluno?q=Texto
      router.push(`/aluno?q=${encodeURIComponent(term)}`)
    } else {
      // Se apagou tudo, limpa a URL: /aluno
      router.push('/aluno')
    }
    
    // Opcional: Atualiza a tela sem recarregar
    router.refresh()
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto mt-4">
      <input 
        type="text" 
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Digite sua cidade ou bairro..." 
        className="flex-1 p-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
      />
      <button 
        type="submit"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Buscar
      </button>
    </form>
  )
}