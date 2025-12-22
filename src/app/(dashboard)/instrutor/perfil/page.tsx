'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// Tipos para nos ajudar no código
type DocType = 'cnh' | 'certificate_instructor' | 'detran_credential' | 'vehicle_crlv'

export default function InstructorProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // ID do instrutor (só existe depois de salvar a primeira vez)
  const [instructorId, setInstructorId] = useState<string | null>(null)
  const [globalStatus, setGlobalStatus] = useState('pending')

  // Estado dos Dados Pessoais
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
  })

  // Estado dos Documentos (Carregados do banco)
  const [documents, setDocuments] = useState<Record<string, { url: string, status: string }>>({})

  // 1. CARREGAR DADOS AO ABRIR A TELA
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      // Preenche e-mail automaticamente se estiver vazio
      setFormData(prev => ({ ...prev, email: user.email || '' }))

      // Busca dados do Instrutor
      const { data: instructor } = await supabase
        .from('instructors')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (instructor) {
        setInstructorId(instructor.id)
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
        })

        // Busca Documentos Já Enviados
        const { data: docs } = await supabase
          .from('instructor_documents')
          .select('*')
          .eq('instructor_id', instructor.id)

        if (docs) {
          const docsMap: Record<string, any> = {}
          docs.forEach(doc => {
            docsMap[doc.type] = { url: doc.url, status: doc.status }
          })
          setDocuments(docsMap)
        }
      } else {
        // Se não tem perfil, tenta pegar nome do cadastro básico
        const { data: profile } = await supabase.from('profiles').select('full_name').single()
        if (profile) setFormData(prev => ({ ...prev, full_name: profile.full_name || '' }))
      }
      setLoading(false)
    }
    loadData()
  }, [supabase, router])

  // 2. SALVAR DADOS PESSOAIS
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const dataToSave = {
      user_id: user.id,
      ...formData,
      price_per_class: parseFloat(formData.price_per_class),
      status: 'pending' // Qualquer alteração volta para análise
    }

    // Upsert na tabela instructors
    const { data, error } = await supabase
      .from('instructors')
      .upsert(dataToSave, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      setMsg({ type: 'error', text: 'Erro ao salvar: ' + error.message })
    } else {
      setInstructorId(data.id) // Guarda o ID para poder enviar documentos depois
      setMsg({ type: 'success', text: 'Dados salvos com sucesso! Agora envie os documentos.' })
      window.scrollTo(0, 0)
    }
    setSaving(false)
  }

  // 3. UPLOAD DE DOCUMENTOS
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: DocType) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    if (!instructorId) {
      alert('Por favor, clique em "Salvar Dados Cadastrais" antes de enviar documentos.')
      return
    }

    setUploadingDoc(docType)
    const file = e.target.files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `${instructorId}/${docType}_${Date.now()}.${fileExt}` // Organiza por pasta do ID
    const filePath = `${fileName}`

    // 1. Sobe arquivo
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (uploadError) {
      alert('Erro no upload: ' + uploadError.message)
      setUploadingDoc(null)
      return
    }

    // 2. Pega URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    // 3. Salva na tabela instructor_documents
    // Primeiro remove anterior desse tipo se houver (opcional, mas bom pra limpar)
    await supabase.from('instructor_documents').delete().match({ instructor_id: instructorId, type: docType })

    const { error: dbError } = await supabase.from('instructor_documents').insert({
      instructor_id: instructorId,
      type: docType,
      url: publicUrl,
      status: 'pending'
    })

    if (dbError) {
      alert('Erro ao salvar referência: ' + dbError.message)
    } else {
      // Atualiza visualmente
      setDocuments(prev => ({
        ...prev,
        [docType]: { url: publicUrl, status: 'pending' }
      }))
    }
    setUploadingDoc(null)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando perfil...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        
        {/* Header Status */}
        <div className={`${globalStatus === 'approved' ? 'bg-green-600' : 'bg-blue-600'} p-6 text-white flex justify-between items-center`}>
          <div>
            <h1 className="text-2xl font-bold">Cadastro do Instrutor</h1>
            <p className="opacity-90 text-sm mt-1">
              {globalStatus === 'approved' 
                ? 'Seu perfil está VERIFICADO e ativo na busca! 🎉' 
                : 'Preencha tudo para enviar para análise.'}
            </p>
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-lg text-sm font-bold backdrop-blur-sm uppercase">
            Status: {globalStatus === 'approved' ? 'Aprovado' : 'Pendente'}
          </div>
        </div>

        <div className="p-8">
          {msg && (
            <div className={`p-4 mb-6 rounded-lg text-sm font-bold ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-8">
            
            {/* 1. DADOS PESSOAIS */}
            <section>
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                1. Dados Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <input name="full_name" required value={formData.full_name} onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  <input name="cpf" required placeholder="000.000.000-00" value={formData.cpf} onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input name="email" type="email" readOnly value={formData.email} className="w-full p-2 border rounded bg-gray-100 text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp / Celular</label>
                  <input name="phone" required value={formData.phone} onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </section>

            {/* 2. LOCALIZAÇÃO */}
            <section>
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">2. Endereço de Atendimento</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input name="city" required value={formData.city} onChange={handleChange} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado (UF)</label>
                  <input name="state" required placeholder="Ex: RJ" maxLength={2} value={formData.state} onChange={handleChange} className="w-full p-2 border rounded uppercase" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro Principal</label>
                  <input name="neighborhood" required value={formData.neighborhood} onChange={handleChange} className="w-full p-2 border rounded" />
                </div>
              </div>
            </section>

            {/* 3. DADOS PROFISSIONAIS */}
            <section>
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">3. Credenciais e Veículo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número Credencial Detran</label>
                  <input name="detran_number" required value={formData.detran_number} onChange={handleChange} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UF da Credencial</label>
                  <input name="detran_state" required placeholder="Ex: RJ" maxLength={2} value={formData.detran_state} onChange={handleChange} className="w-full p-2 border rounded uppercase" />
                </div>
                
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-5 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria Instrução</label>
                    <select name="cnh_category" value={formData.cnh_category} onChange={handleChange} className="w-full p-2 border rounded bg-white">
                      <option value="A">Moto (A)</option>
                      <option value="B">Carro (B)</option>
                      <option value="AB">Carro e Moto (AB)</option>
                      <option value="D">Ônibus (D)</option>
                      <option value="E">Carreta (E)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Câmbio do Veículo</label>
                    <select name="vehicle_type" value={formData.vehicle_type} onChange={handleChange} className="w-full p-2 border rounded bg-white">
                      <option value="Manual">Manual</option>
                      <option value="Automatico">Automático</option>
                      <option value="Adaptado">Adaptado (PCD)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço Aula (R$)</label>
                    <input name="price_per_class" type="number" required placeholder="0.00" value={formData.price_per_class} onChange={handleChange} className="w-full p-2 border rounded" />
                  </div>
                  <div className="md:col-span-3">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="own" name="own_vehicle" checked={formData.own_vehicle} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                      <label htmlFor="own" className="text-sm text-gray-700">Possuo veículo próprio para as aulas (não dependo da autoescola)</label>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Sobre mim (Aparecerá na busca)</label>
                   <textarea name="description" rows={3} value={formData.description} onChange={handleChange} placeholder="Conte sua experiência, anos de estrada, método de ensino..." className="w-full p-2 border rounded" />
                </div>
              </div>

              <div className="mt-6">
                <button type="submit" disabled={saving} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm w-full md:w-auto">
                  {saving ? 'Salvando...' : 'Salvar Dados Cadastrais'}
                </button>
                <p className="text-xs text-gray-500 mt-2">Salve os dados acima antes de enviar os documentos abaixo.</p>
              </div>
            </section>
          </form>

          <hr className="my-10 border-gray-200" />

          {/* 4. DOCUMENTAÇÃO (Separado) */}
          <section className={!instructorId ? 'opacity-50 pointer-events-none grayscale' : ''}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">4. Documentos Obrigatórios</h3>
              {!instructorId && <span className="text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded">Salve o perfil primeiro</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card de Upload: CNH */}
              <DocumentUploadCard 
                title="CNH (Carteira de Habilitação)"
                subtitle="Frente e verso ou PDF aberto"
                docType="cnh"
                currentDoc={documents['cnh']}
                loading={uploadingDoc === 'cnh'}
                onUpload={(e) => handleFileUpload(e, 'cnh')}
              />

              {/* Card de Upload: Credencial */}
              <DocumentUploadCard 
                title="Credencial de Instrutor"
                subtitle="Carteirinha do Detran ou certificado"
                docType="detran_credential"
                currentDoc={documents['detran_credential']}
                loading={uploadingDoc === 'detran_credential'}
                onUpload={(e) => handleFileUpload(e, 'detran_credential')}
              />

              {/* Card de Upload: Certificado Curso */}
              <DocumentUploadCard 
                title="Certificado do Curso"
                subtitle="Certificado de conclusão do curso de instrutor"
                docType="certificate_instructor"
                currentDoc={documents['certificate_instructor']}
                loading={uploadingDoc === 'certificate_instructor'}
                onUpload={(e) => handleFileUpload(e, 'certificate_instructor')}
              />

              {/* Card de Upload: CRLV */}
              {formData.own_vehicle && (
                <DocumentUploadCard 
                  title="Documento do Veículo (CRLV)"
                  subtitle="Obrigatório para quem usa carro próprio"
                  docType="vehicle_crlv"
                  currentDoc={documents['vehicle_crlv']}
                  loading={uploadingDoc === 'vehicle_crlv'}
                  onUpload={(e) => handleFileUpload(e, 'vehicle_crlv')}
                />
              )}

            </div>
          </section>

        </div>
      </div>
    </div>
  )
}

// Pequeno componente para limpar o código repetitivo dos cards de upload
function DocumentUploadCard({ title, subtitle, docType, currentDoc, loading, onUpload }: any) {
  return (
    <div className={`border rounded-lg p-5 flex flex-col justify-between transition-all ${currentDoc ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
      <div>
        <div className="flex justify-between items-start">
          <h4 className="font-bold text-gray-800">{title}</h4>
          {currentDoc && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${currentDoc.status === 'approved' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
              {currentDoc.status === 'approved' ? 'Aprovado' : 'Em Análise'}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1 mb-4">{subtitle}</p>
      </div>

      <div>
        {currentDoc ? (
          <div className="mb-3 text-xs text-green-700 flex items-center gap-1 font-medium">
            <span>✅ Arquivo enviado</span>
            <a href={currentDoc.url} target="_blank" className="underline hover:text-green-900 ml-2">Ver arquivo</a>
          </div>
        ) : (
          <div className="mb-3 text-xs text-gray-400 italic">Pendente de envio</div>
        )}

        <label className={`block w-full text-center py-2 px-4 rounded border cursor-pointer transition-colors text-sm font-medium
          ${loading ? 'bg-gray-100 text-gray-400' : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50'}
        `}>
          {loading ? 'Enviando...' : (currentDoc ? 'Enviar Novamente' : 'Selecionar Arquivo')}
          <input type="file" accept="image/*,application/pdf" className="hidden" disabled={loading} onChange={onUpload} />
        </label>
      </div>
    </div>
  )
}