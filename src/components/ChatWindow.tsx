'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ChatWindow({ scheduleId, currentUserId }: { scheduleId: string, currentUserId: string }) {
  const supabase = createClient()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // 1. Carrega mensagens e assina atualizações
  useEffect(() => {
    // Busca histórico inicial
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('schedule_id', scheduleId)
        .order('created_at', { ascending: true })
      
      if (data) setMessages(data)
    }
    fetchMessages()

    // --- REALTIME (O Segredo do Chat ao Vivo) ---
    // Criamos um canal ÚNICO para esta aula usando o ID dela
    const channel = supabase
      .channel(`room-${scheduleId}`) 
      .on(
        'postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `schedule_id=eq.${scheduleId}` 
        }, 
        (payload) => {
          // Quando chegar mensagem nova, adiciona na lista
          console.log('Nova mensagem recebida!', payload.new)
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    // Limpa a conexão ao sair da tela
    return () => { supabase.removeChannel(channel) }
  }, [scheduleId, supabase])

  // Rola para baixo sempre que a lista de mensagens mudar
  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [messages])

  // 2. Enviar Mensagem
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    // Otimista: Limpa o input na hora para parecer rápido
    const msgTemp = newMessage
    setNewMessage('')

    const { error } = await supabase.from('messages').insert({
      schedule_id: scheduleId,
      sender_id: currentUserId,
      content: msgTemp
    })

    if (error) {
      alert('Erro ao enviar: ' + error.message)
      setNewMessage(msgTemp) // Devolve o texto se der erro
    }
  }

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      
      {/* Área das Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-10">
            Nenhuma mensagem. Diga "Olá"! 👋
          </div>
        )}
        
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 rounded-xl text-sm shadow-sm ${
                isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-2">
        <input 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">
          Enviar
        </button>
      </form>
    </div>
  )
}