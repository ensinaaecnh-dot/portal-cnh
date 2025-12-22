import { createClient } from '@/lib/supabase/server'

// Lista de e-mails que são ADMINS
const ADMIN_EMAILS = [
  'ensinaaecnh@gmail.com', // <--- SUBSTITUA PELO SEU E-MAIL REAL QUE USA NO LOGIN
  'admin@portal.com'
]

export async function checkIsAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
    return false
  }
  return true
}