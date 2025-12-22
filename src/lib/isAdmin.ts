import { createClient } from '@/lib/supabase/server'

// Lista de e-mails que são ADMINS
const ADMIN_EMAILS = [
  'ensinaaecnh@gmail.com', // <--- ADICIONE AQUI
  'eduardofbezerra@gmail.com'   // (Pode manter o seu pessoal se quiser)
]

export async function checkIsAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Se não estiver logado ou o e-mail não estiver na lista acima...
  if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
    return false
  }
  return true
}