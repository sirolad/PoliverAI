import React from 'react'
import { View, Text, Button, StyleSheet, ScrollView, TextInput } from 'react-native'
import rnStyleFromTokens from './rnStyleTokens'

type Props = {
  persisted?: any
  file?: any
  setFile?: (f: any) => void
  fileInputRef?: any
  handleFileChange?: (e: any) => void
  handleAnalyze?: () => void
  result?: any
  userReportsCount?: number | null
  reportFilename?: string | null
  activeTab?: string
  progress?: number
  message?: string
  isLoadingForTab?: boolean
  detailedContent?: string | null
  detailedReport?: Record<string, unknown> | null
  revisedPolicy?: Record<string, unknown> | null
  fullReportSource?: Record<string, unknown> | null
  detailedDownloadUrl?: string | null
  setLoadingDetailed?: (b: boolean) => void
  setLoadingRevised?: (b: boolean) => void
  setActiveTab?: (s: string) => void
  handleGenerateReport?: () => void
}

export default function PolicyWorkspace(props: Props) {
  const { handleAnalyze, handleGenerateReport, progress = 0, activeTab = 'free', file, setFile } = props
  const [filenameInput, setFilenameInput] = React.useState<string>(file?.name ?? '')
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={rnStyleFromTokens({ size: 'lg', weight: 'semibold' }) as any}>Policy workspace (native)</Text>
      <Text style={rnStyleFromTokens({ size: 'sm' }) as any}>This is a lightweight native placeholder for PolicyWorkspace. We'll incrementally port web behaviour into this component.</Text>
      <View style={{ marginTop: 12 }}>
        <TextInput placeholder="Enter filename (simulate upload)" value={filenameInput} onChangeText={setFilenameInput} style={styles.input} />
        <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Button title="Set file" onPress={() => { if (setFile) setFile({ name: filenameInput }) }} />
          <Button title="Analyze" onPress={() => { if (handleAnalyze) handleAnalyze() }} />
        </View>
        <View style={{ marginTop: 8 }}>
          <Button title="Generate Full Report" onPress={() => { if (handleGenerateReport) handleGenerateReport() }} />
        </View>
      </View>
      <View style={{ marginTop: 12 }}>
        <Text>Active tab: {activeTab}</Text>
        <Text>Progress: {progress}%</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({ container: { padding: 16 }, input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6 } })
