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

  // Estado dos dados
  const [formData, setFormData] = useState({
    full_name: '',
    detran_number: '',
    city: '',
    neighborhood: '',
    price_per_class: '',
    phone: '',
    description: '',
    cnh_category: 'B',
    own_vehicle: true,
    cnh_url: '',
    certificate_url: '',
    vehicle_doc_url: ''
  })
  
  const [status, setStatus] = useState('pendente')

  // Carrega dados iniciais
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

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
          description: instructor.description || '',
          cnh_category: instructor.cnh_category || 'B',
          own_vehicle: instructor.own_vehicle,
          cnh_url: instructor.cnh_url || '',
          certificate_url: instructor.certificate_url || '',
          vehicle_doc_url: instructor.vehicle_doc_url || ''
        })
        setStatus(instructor.verification_status || 'pendente')
      }
      setLoading(false)
    }
    loadData()
  }, [supabase, router])

  // Função mágica de Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${field}/${fileName}`

    setSaving(true)
    // Sobe para o Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (uploadError) {
      alert('Erro ao subir arquivo!')
      setSaving(false)
      return
    }

    // Pega a URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    // Atualiza o formulário localmente
    setFormData(prev => ({ ...prev, [field]: publicUrl }))
    setSaving(false)
  }

  // Salvar no Banco
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const dataToSave = {
      user_id: user.id,
      ...formData,
      price_per_class: parseFloat(formData.price_per_class),
      // Sempre que salvar, volta para pendente para o admin revisar as mudanças
      verification_status: 'pendente' 
    }

    const { error } = await supabase.from('instructors').upsert(dataToSave, { onConflict: 'user_id' })

    if (error) {
      setMsg('Erro: ' + error.message)
    } else {
      setMsg('Dados enviados! Aguarde a verificação da nossa equipe.')
      setStatus('pendente')
      window.scrollTo(0,0)
    }
    setSaving(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        
        {/* Status Header */}
        <div className={`${status === 'aprovado' ? 'bg-green-600' : 'bg-yellow-500'} p-6 text-white`}>
          <h1 className="text-2xl font-bold">Perfil do Instrutor</h1>
          <p className="font-medium mt-1">
            Status: {status === 'aprovado' ? 'VERIFICADO E ATIVO ✅' : 'EM ANÁLISE / PENDENTE ⏳'}
          </p>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-8">
          {msg && <div className="p-4 bg-blue-50 text-blue-700 rounded-lg">{msg}</div>}

          {/* Seção 1: Dados Básicos */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Dados Profissionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Nome Completo</label>
                <input name="full_name" required value={formData.full_name} onChange={handleChange} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Número Credencial (DETRAN)</label>
                <input name="detran_number" required value={formData.detran_number} onChange={handleChange} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cidade</label>
                <input name="city" required value={formData.city} onChange={handleChange} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bairro</label>
                <input name="neighborhood" required value={formData.neighborhood} onChange={handleChange} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preço Aula (R$)</label>
                <input name="price_per_class" type="number" required value={formData.price_per_class} onChange={handleChange} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">WhatsApp</label>
                <input name="phone" required value={formData.phone} onChange={handleChange} className="w-full p-2 border rounded" />
              </div>
            </div>
          </section>

          {/* Seção 2: Especificações */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Detalhes da Aula</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Categoria CNH</label>
                <select name="cnh_category" value={formData.cnh_category} onChange={handleChange} className="w-full p-2 border rounded">
                  <option value="A">Moto (A)</option>
                  <option value="B">Carro (B)</option>
                  <option value="AB">Carro e Moto (AB)</option>
                  <option value="D">Ônibus (D)</option>
                </select>
              </div>
              <div className="flex items-center mt-6">
                <input type="checkbox" name="own_vehicle" checked={formData.own_vehicle} onChange={handleChange} className="w-5 h-5 text-blue-600" />
                <label className="ml-2 text-gray-700">Possuo Veículo Próprio para Aula</label>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Sobre você</label>
              <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className="w-full p-2 border rounded"></textarea>
            </div>
          </section>

          {/* Seção 3: Documentação (Uploads) */}
          <section className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Documentação Obrigatória</h3>
            <p className="text-sm text-gray-500 mb-4">Seus documentos não aparecerão publicamente, servem apenas para validação.</p>
            
            <div className="space-y-4">
              {/* Upload CNH */}
              <div>
                <label className="block text-sm font-medium mb-1">Foto da CNH Aberta</label>
                <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'cnh_url')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                {formData.cnh_url && <span className="text-xs text-green-600 font-bold">Arquivo enviado ✓</span>}
              </div>

              {/* Upload Credencial */}
              <div>
                <label className="block text-sm font-medium mb-1">Credencial de Instrutor</label>
                <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'certificate_url')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                {formData.certificate_url && <span className="text-xs text-green-600 font-bold">Arquivo enviado ✓</span>}
              </div>

              {/* Upload Doc Carro */}
              <div>
                <label className="block text-sm font-medium mb-1">Documento do Veículo (CRLV)</label>
                <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'vehicle_doc_url')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                {formData.vehicle_doc_url && <span className="text-xs text-green-600 font-bold">Arquivo enviado ✓</span>}
              </div>
            </div>
          </section>

          <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-lg">
            {saving ? 'Enviando...' : 'Salvar e Solicitar Aprovação'}
          </button>
        </form>
      </div>
    </div>
  )
}