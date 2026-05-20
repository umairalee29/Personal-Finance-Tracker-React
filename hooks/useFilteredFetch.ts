import { useState, useEffect, useRef } from 'react'

interface Options<T, F> {
  defaultValue: F
  filter: F
  initialData: T
  isInitialLoading: boolean
  fetcher: (filter: F) => Promise<T>
}

/**
 * Manages data + loading state for a filterable card.
 * When filter === defaultValue, syncs from the parent SWR hook (no extra request).
 * When filter changes away from default, fetches independently and cancels stale requests.
 */
export function useFilteredFetch<T, F>({
  defaultValue,
  filter,
  initialData,
  isInitialLoading,
  fetcher,
}: Options<T, F>): { data: T; loading: boolean } {
  const [data, setData] = useState<T>(initialData)
  const [loading, setLoading] = useState(isInitialLoading)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  // Sync from parent when filter is at default
  useEffect(() => {
    if (filter !== defaultValue) return
    setData(initialData)
    setLoading(isInitialLoading)
  }, [initialData, isInitialLoading, filter, defaultValue])

  // Fetch independently when filter departs from default
  useEffect(() => {
    if (filter === defaultValue) return
    let cancelled = false
    setLoading(true)
    fetcherRef.current(filter)
      .then((result) => { if (!cancelled) setData(result) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [filter, defaultValue])

  return { data, loading }
}
