import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView } from 'react-native'
import useReports from '../components/reports-ui/useReports'
import useSelection from '../components/reports-ui/useSelection'
import Filters from '../components/reports-ui/Filters.native'
import ReportsToolbar from '../components/reports-ui/ReportsToolbar.native'
import BulkActions from '../components/reports-ui/BulkActions.native'
import { ReportCard, ReportViewerModal, NoDataView } from '@poliverai/shared-ui'
import policyService from '../services/policyService'

export default function ReportsScreen() {
  const { reports, page, setPage, limit, setLimit, total, isLoading, error, fetchReports } = useReports()
  const { selectedFiles, toggle, clear, getSelected, syncWithReports } = useSelection()
  const [viewerUrl, setViewerUrl] = useState<string | null>(null)

  useEffect(() => {
    syncWithReports(reports)
  }, [reports, syncWithReports])

  const onSelectAll = () => {
    const names = reports.map(r => r.filename)
    names.forEach(n => {
      if (!selectedFiles[n]) toggle(n)
    })
  }

  const onDeleteSelected = async () => {
    const toDelete = getSelected()
    if (toDelete.length === 0) return
    try {
      await policyService.bulkDeleteReports({ filenames: toDelete })
      await fetchReports()
      clear()
    } catch (e) {
      console.error('Failed to delete reports', e)
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', padding: 12 }}>Reports</Text>
      <ReportsToolbar total={total} page={page} setPage={setPage} limit={limit} setLimit={setLimit} onSelectAll={onSelectAll} />
      <BulkActions onRefresh={fetchReports} onDeleteSelected={onDeleteSelected} disabled={getSelected().length === 0} />
      <Filters query={''} setQuery={() => undefined} statusFilter={null} setStatusFilter={() => undefined} />

      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {isLoading && <Text>Loading...</Text>}
        {!isLoading && error && <NoDataView message={error} />}
        {!isLoading && !error && reports.length === 0 && <NoDataView message="No reports" />}
        {!isLoading && reports.map(r => (
          <ReportCard key={r.filename} title={r.document_name ?? r.filename} onOpen={() => setViewerUrl(`/api/report/${r.filename}`)} />
        ))}
      </ScrollView>

      <ReportViewerModal open={!!viewerUrl} reportUrl={viewerUrl ?? undefined} onClose={() => setViewerUrl(null)} />
    </View>
  )
}
