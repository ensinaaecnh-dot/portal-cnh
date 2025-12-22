'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function InstructorProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  // Campos do formulário
  const [formData, setFormData] = useState({
    full_name: '',
    detran_number: '',
    city: '',
    neighborhood: '',
    price_per_class: '',
    phone: '',
    description: ''
  })

  // 1. Ao carregar a tela, busca os dados se já existirem
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      // Busca dados do anúncio deste usuário
      const { data: instructor } = await supabase
        .from('instructors')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (instructor) {
        setFormData({
          full_name: instructor.full_name || '',
          detran_number: instructor.detran_number || '',
          city: instructor.city || '',
          neighborhood: instructor.neighborhood || '',
          price_per_class: instructor.price_per_class?.toString() || '',
          phone: instructor.phone || '',
          description: instructor.description || ''
        })
      } else {
        // Se não tem anúncio, tenta pegar pelo menos o nome do perfil
        const { data: profile } = await supabase.from('profiles').select('full_name').single()
        if (profile) setFormData(prev => ({ ...prev, full_name: profile.full_name || '' }))
      }
      setLoading(false)
    }
    loadData()
  }, [supabase, router])

  // 2. Função de Salvar (Criar ou Atualizar)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Prepara os dados para salvar
    const dataToSave = {
      user_id: user.id,
      full_name: formData.full_name,
      detran_number: formData.detran_number,
      city: formData.city,
      neighborhood: formData.neighborhood,
      price_per_class: parseFloat(formData.price_per_class),
      phone: formData.phone.replace(/\D/g, ''), // Remove caracteres não numéricos
      description: formData.description
    }

    // O comando UPSERT cria se não existe, ou atualiza se já existe (baseado no user_id se tiver constraint, mas aqui vamos buscar pelo ID ou criar novo)
    // Como nossa tabela não tem constraint unique no user_id por padrão, vamos fazer um check simples:
    
    // Primeiro tenta atualizar
    const { error: updateError, data: updated } = await supabase
      .from('instructors')
      .update(dataToSave)
      .eq('user_id', user.id)
      .select()

    let error = updateError

    // Se não atualizou nada (porque não existia), então cria
    if (!error && updated?.length === 0) {
      const { error: insertError } = await supabase
        .from('instructors')
        .insert([dataToSave])
      error = insertError
    }

    if (error) {
      setMsg('Erro ao salvar: ' + error.message)
    } else {
      setMsg('Sucesso! Seu perfil de instrutor foi atualizado.')
      router.refresh()
    }
    setSaving(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  if (loading) return <div className="p-8 text-center">Carregando seus dados...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="bg-blue-600 p-6 text-white">
          <h1 className="text-2xl font-bold">Área do Instrutor</h1>
          <p className="opacity-90">Preencha os dados abaixo para que os alunos te encontrem.</p>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          {msg && (
            <div className={`p-4 rounded-lg text-sm font-medium ${msg.includes('Sucesso') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {msg}
            </div>
          )}

          {/* Dados Pessoais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input name="full_name" required value={formData.full_name} onChange={handleChange} className="w-full p-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credencial (DETRAN)</label>
              <input name="detran_number" required value={formData.detran_number} onChange={handleChange} placeholder="Ex: 12345-RJ" className="w-full p-2 border rounded-md" />
            </div>
          </div>

          {/* Localização e Preço */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input name="city" required value={formData.city} onChange={handleChange} className="w-full p-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bairro de Atuação</label>
              <input name="neighborhood" required value={formData.neighborhood} onChange={handleChange} className="w-full p-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço da Aula (R$)</label>
              <input name="price_per_class" type="number" required value={formData.price_per_class} onChange={handleChange} placeholder="0.00" className="w-full p-2 border rounded-md" />
            </div>
          </div>

          {/* Contato e Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp (com DDD)</label>
            <input name="phone" required type="tel" value={formData.phone} onChange={handleChange} placeholder="11 99999-9999" className="w-full p-2 border rounded-md" />
            <p className="text-xs text-gray-500 mt-1">Os alunos entrarão em contato por este número.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sobre você e suas aulas</label>
            <textarea name="description" rows={4} value={formData.description} onChange={handleChange} placeholder="Conte sua experiência, tipo de carro, se busca em casa..." className="w-full p-2 border rounded-md"></textarea>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Salvando...' : 'Salvar Anúncio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}