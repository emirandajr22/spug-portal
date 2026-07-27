import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useDpiData() {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    supabase
      .schema('spug')
      .from('dpi_data')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data: rows, error: e }) => {
        if (e) setError(e)
        else setData(rows || [])
        setLoading(false)
      })
  }, [])

  return { data, loading, error }
}
