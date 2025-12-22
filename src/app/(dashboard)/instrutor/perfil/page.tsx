'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image' // Import para mostrar a foto bonitinha

export default function InstructorProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Campos do formulário
  const [formData, setFormData] = useState({
    full_name: '',
    cpf: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    neighborhood: '',
    detran_number: '',
    detran_state: '',
    cnh_category: 'B',
    vehicle_type: 'Manual',
    price_per_class: '',
    description: '',
    own_vehicle: true,
    avatar_url: '',    // Nova Foto de Perfil
    car_photo_url: ''  // Nova Foto do Carro
  })

  // Status global
  const [globalStatus, setGlobalStatus] = useState('pending')

  // 1. CARREGAR DADOS
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      setFormData(prev => ({ ...prev, email: user.email || '' }))

      const { data: instructor } = await supabase
        .from('instructors')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (instructor) {
        setGlobalStatus(instructor.status)
        setFormData({
          full_name: instructor.full_name || '',
          cpf: instructor.cpf || '',
          email: instructor.email || user.email || '',
          phone: instructor.phone || '',
          city: instructor.city || '',
          state: instructor.state || '',
          neighborhood: instructor.neighborhood || '',
          detran_number: instructor.detran_number || '',
          detran_state: instructor.detran_state || '',
          cnh_category: instructor.cnh_category || 'B',
          vehicle_type: instructor.vehicle_type || 'Manual',
          price_per_class: instructor.price_per_class?.toString() || '',
          description: instructor.description || '',
          own_vehicle: instructor.own_vehicle ?? true,
          avatar_url: instructor.avatar_url || '',
          car_photo_url: instructor.car_photo_url || ''
        })
      }
      setLoading(false)
    }
    loadData()
  }, [supabase, router])

  // 2. FUNÇÃO DE UPLOAD SIMPLIFICADA
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar_url' | 'car_photo_url') => {
    if (!e.target.files || e.target.files.length === 0) return
    
    setSaving(true)
    const file = e.target.files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `${field}_${Date.now()}.${fileExt}`
    
    // Salva na pasta 'public' do bucket documents para facilitar
    const filePath = `public_profiles/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('documents') // Podemos usar o mesmo bucket, mas fotos públicas
      .upload(filePath, file)

    if (uploadError) {
      alert('Erro ao enviar imagem: ' + uploadError.message)
      setSaving(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    // Atualiza o estado local com a nova URL
    setFormData(prev => ({ ...prev, [field]: publicUrl }))
    setSaving(false)
  }

  // 3. SALVAR TUDO
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Validação básica
    if (!formData.avatar_url) {
      setMsg({ type: 'error', text: 'Por favor, adicione uma foto de perfil.' })
      setSaving(false)
      return
    }

    const dataToSave = {
      user_id: user.id,
      ...formData,
      price_per_class: parseFloat(formData.price_per_class),
      status: 'pending' // Volta para pendente para você aprovar a foto nova
    }

    const { error } = await supabase
      .from('instructors')
      .upsert(dataToSave, { onConflict: 'user_id' })

    if (error) {
      setMsg({ type: 'error', text: 'Erro ao salvar: ' + error.message })
    } else {
      setMsg({ type: 'success', text: 'Perfil salvo! Aguarde a aprovação da sua foto.' })
      window.scrollTo(0, 0)
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
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        
        <div className={`${globalStatus === 'approved' ? 'bg-green-600' : 'bg-blue-600'} p-6 text-white flex justify-between items-center`}>
          <div>
            <h1 className="text-2xl font-bold">Perfil do Instrutor</h1>
            <p className="opacity-90 text-sm mt-1">Capriche nas fotos! É assim que os alunos escolhem você.</p>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded text-sm font-bold uppercase">
            {globalStatus === 'approved' ? 'Ativo' : 'Em Análise'}
          </div>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-8">
          {msg && (
            <div className={`p-4 rounded-lg text-sm font-bold ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {msg.text}
            </div>
          )}

          {/* ÁREA DE FOTOS (DESTAQUE) */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            
            {/* Foto de Perfil */}
            <div className="flex flex-col items-center">
              <span className="font-bold text-gray-700 mb-3">Sua Foto de Perfil</span>
              <div className="relative w-32 h-32 mb-4">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Perfil" className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 shadow-sm" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                    Sem foto
                  </div>
                )}
                {/* Botão flutuante de editar */}
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'avatar_url')} />
                </label>
              </div>
              <p className="text-xs text-gray-500 text-center">Use uma foto clara e profissional.</p>
            </div>

            {/* Foto do Carro */}
            <div className="flex flex-col items-center">
              <span className="font-bold text-gray-700 mb-3">Foto do Veículo</span>
              <div className="relative w-full h-32 mb-4 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                 {formData.car_photo_url ? (
                  <img src={formData.car_photo_url} alt="Carro" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    Nenhuma foto do carro
                  </div>
                )}
                 <label className="absolute bottom-2 right-2 bg-gray-900/80 text-white px-3 py-1 text-xs rounded cursor-pointer hover:bg-black">
                  Alterar Foto
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'car_photo_url')} />
                </label>
              </div>
              <p className="text-xs text-gray-500 text-center">Mostre o veículo que o aluno irá usar.</p>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* DADOS CADASTRAIS (TEXTO APENAS) */}
          <section className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800">Dados Cadastrais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input name="full_name" required value={formData.full_name} onChange={handleChange} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF (Apenas números)</label>
                <input name="cpf" required value={formData.cpf} onChange={handleChange} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                <input name="phone" required value={formData.phone} onChange={handleChange} className="w-full p-2 border rounded" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Cidade / Estado</label>
                 <div className="flex gap-2">
                    <input name="city" required placeholder="Cidade" value={formData.city} onChange={handleChange} className="flex-1 p-2 border rounded" />
                    <input name="state" required placeholder="UF" maxLength={2} value={formData.state} onChange={handleChange} className="w-16 p-2 border rounded uppercase text-center" />
                 </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
               <h4 className="font-bold text-blue-800 text-sm mb-3">Informações de Credenciamento (Autodeclaração)</h4>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-700 mb-1">Número Credencial Detran</label>
                    <input name="detran_number" required value={formData.detran_number} onChange={handleChange} className="w-full p-2 border border-blue-200 rounded text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-700 mb-1">UF da Credencial</label>
                    <input name="detran_state" required maxLength={2} value={formData.detran_state} onChange={handleChange} className="w-full p-2 border border-blue-200 rounded text-sm uppercase" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-700 mb-1">Categoria CNH</label>
                    <select name="cnh_category" value={formData.cnh_category} onChange={handleChange} className="w-full p-2 border border-blue-200 rounded text-sm bg-white">
                      <option value="A">A (Moto)</option>
                      <option value="B">B (Carro)</option>
                      <option value="AB">AB (Ambos)</option>
                    </select>
                  </div>
               </div>
               <p className="text-[10px] text-blue-600 mt-2">
                 * Ao salvar, você declara sob as penas da lei que as informações acima são verdadeiras e que sua credencial está ativa.
               </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sobre você e suas aulas</label>
              <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Ex: Paciente, 10 anos de experiência, especialista em baliza..." />
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Preço da Aula (R$)</label>
                   <input name="price_per_class" type="number" required value={formData.price_per_class} onChange={handleChange} className="w-full p-2 border rounded" />
                </div>
                <div className="flex items-center pt-6">
                    <input type="checkbox" id="own" name="own_vehicle" checked={formData.own_vehicle} onChange={handleChange} className="w-5 h-5 text-blue-600" />
                    <label htmlFor="own" className="ml-2 text-sm text-gray-700 font-medium">Possuo veículo próprio para instrução</label>
                </div>
             </div>
          </section>

          <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-lg shadow-lg transform transition active:scale-[0.99]">
            {saving ? 'Salvando...' : 'Salvar Perfil'}
          </button>
        </form>
      </div>
    </div>
  )
}