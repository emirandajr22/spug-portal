import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useDpiData() {
  const [data,      setData]      = useState([])
  const [contracts, setContracts] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    Promise.all([
      supabase
        .schema('spug')
        .from('dpi_data')
        .select('*')
        .order('sort_order', { ascending: true }),
      supabase
        .schema('spug')
        .from('dpi_contracts')
        .select('*')
        .order('effective_date', { ascending: true }),
    ]).then(([{ data: rows, error: e1 }, { data: contracts, error: e2 }]) => {
      if (e1 || e2) setError(e1 || e2)
      else {
        setData(rows || [])
        setContracts(contracts || [])
      }
      setLoading(false)
    })
  }, [])

  return { data, contracts, loading, error }
}
