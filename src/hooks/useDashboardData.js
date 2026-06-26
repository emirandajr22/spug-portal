import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useDashboardData(tableName) {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!tableName) return
    setLoading(true)
    setError(null)

    supabase
      .schema('spug')
      .from(tableName)
      .select('*')
      .order('sort_order', { ascending: true })   // ← chronological order
      .then(({ data: rows, error: err }) => {
        if (err) setError(err)
        else     setData(rows || [])
        setLoading(false)
      })
  }, [tableName])

  return { data, loading, error }
}
