import { View, Text, ScrollView, StyleSheet } from 'react-native'
import rnStyleFromTokens from './rnStyleTokens'
import AnalysisProgress from './AnalysisProgress.native'
import RevisedPolicyPreview from './RevisedPolicyPreview.native'
import NoDataView from './NoDataView.native'
import LoadingSpinner from './LoadingSpinner.native'

type Props = {
  activeTab: 'free' | 'full' | 'revised'
  progress: number
  message: string
  isLoadingForTab: boolean
  result: any
  reportFilename: string | null
  detailedContent: string | null
  detailedReport: Record<string, unknown> | null
  revisedPolicy: Record<string, unknown> | null
  fullReportSource: Record<string, unknown> | null
  detailedDownloadUrl: string | null
  setLoadingDetailed: (v: boolean) => void
  setLoadingRevised: (v: boolean) => void
  setActiveTab: (tab: 'free' | 'full' | 'revised') => void
  handleGenerateReport?: () => void
}

export default function PolicyMainPanel(props: Props) {
  const { activeTab, progress, message, isLoadingForTab, result, detailedContent, fullReportSource, detailedDownloadUrl, handleGenerateReport } = props
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={rnStyleFromTokens({ size: 'lg', weight: 'semibold' }) as any}>Policy</Text>
      {progress > 0 && <AnalysisProgress message={message} progress={progress} />}
      {activeTab === 'free' ? (
        isLoadingForTab ? <LoadingSpinner message={message} /> : result ? <Text>Free report (summary)</Text> : <NoDataView title="No analysis" />
      ) : (
        isLoadingForTab ? <LoadingSpinner message="Loading report" /> : (
          activeTab === 'full' ? (
            fullReportSource ? <Text>Full report dashboard</Text> : <Text onPress={() => { if (handleGenerateReport) handleGenerateReport() }}>Generate Full Report</Text>
          ) : (
            detailedContent ? <Text>{detailedContent}</Text> : <RevisedPolicyPreview downloadUrl={detailedDownloadUrl} />
          )
        )
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({ container: { padding: 12 } })
