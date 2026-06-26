import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)

        // Update last_login when user signs in
        if (event === 'SIGNED_IN' && session?.user) {
          supabase
            .schema('spug')
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('auth_user_id', session.user.id)
            .then(() => {})
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Fetch the spug.users profile row whenever the auth user changes
  useEffect(() => {
    if (!user) return setProfile(null)

    supabase
      .schema('spug')
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()
      .then(({ data }) => setProfile(data ?? null))
  }, [user])

  return { user, profile, loading }
}
