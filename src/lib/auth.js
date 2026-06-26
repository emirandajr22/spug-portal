import { supabase } from './supabase'

export async function signIn(username, password) {
  // We use email convention: username@spug.internal
  const email = `${username}@spug.internal`
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  return await supabase.auth.signOut()
}

export async function getSession() {
  return await supabase.auth.getSession()
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}
