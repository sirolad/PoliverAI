import { useCallback, useEffect, useState } from 'react'
import policyService from '@/services/policyService'
import type { ReportMetadata } from '@/types/api'

export default function useReports(initialPage = 1, initialLimit = 10) {
  const [reports, setReports] = useState<ReportMetadata[]>([])
  const [page, setPage] = useState<number>(initialPage)
  const [limit, setLimit] = useState<number>(initialLimit)
  const [total, setTotal] = useState<number | null>(null)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const resp = await policyService.getUserReports({ page, limit })
      let arr: ReportMetadata[] = []
      if (Array.isArray(resp)) {
        arr = resp as ReportMetadata[]
        setReports(arr)
        setTotal(arr.length)
        setTotalPages(1)
      } else {
        arr = resp.reports || []
        setReports(arr)
        setTotal(resp.total ?? arr.length)
        setTotalPages(resp.total_pages ?? 1)
      }
      if (!arr || arr.length === 0) setError('You have no reports on file with us yet 🙂')
      else setError(null)
    } catch (e) {
      console.error('Failed to fetch reports', e)
      setError('Failed to load reports')
    } finally {
      setIsLoading(false)
    }
  }, [page, limit])

  useEffect(() => { fetchReports() }, [fetchReports])

  return { reports, setReports, page, setPage, limit, setLimit, total, totalPages, isLoading, error, fetchReports }
}
