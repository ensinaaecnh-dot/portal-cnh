'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  // Estado para controlar o tipo de usuário (padrão é aluno)
  const [userType, setUserType] = useState<'aluno' | 'instrutor'>('aluno')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)

    // Cria o usuário enviando o ROLE correto (aluno ou instrutor)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: userType, // <--- Aqui está o segredo!
        },
      },
    })

    if (error) {
      setMsg(`Erro: ${error.message}`)
      setLoading(false)
    } else {
      setMsg('Conta criada com sucesso! Redirecionando...')
      // Se for instrutor, manda preencher o perfil. Se for aluno, vai pra busca.
      setTimeout(() => {
        if (userType === 'instrutor') {
            router.push('/instrutor/perfil') 
        } else {
            router.push('/login') // Pede login para garantir
        }
      }, 1500)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Crie sua conta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Escolha como você quer usar o portal
          </p>
        </div>

        {/* Botões de Seleção de Tipo */}
        <div className="flex gap-4 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => setUserType('aluno')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              userType === 'aluno' 
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sou Aluno
          </button>
          <button
            type="button"
            onClick={() => setUserType('instrutor')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              userType === 'instrutor' 
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sou Instrutor
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleRegister}>
          {msg && (
            <div className={`p-3 text-sm rounded-lg border ${msg.includes('sucesso') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {msg}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={userType === 'aluno' ? "Seu nome" : "Nome do Profissional"}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-70 transition-colors"
          >
            {loading ? 'Criando conta...' : `Cadastrar como ${userType === 'aluno' ? 'Aluno' : 'Instrutor'}`}
          </button>

          <div className="text-center text-sm">
            <p className="text-gray-500">
              Já tem conta?{' '}
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
                Faça Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}