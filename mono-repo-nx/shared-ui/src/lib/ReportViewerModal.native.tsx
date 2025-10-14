import React from 'react'
import { Modal, View, Text, Button, ScrollView, StyleSheet, Linking } from 'react-native'
import rnStyleFromTokens from './rnStyleTokens'

type Props = { open: boolean, reportUrl?: string, filename?: string | null, inlineContent?: string | null, title?: string, onClose: () => void }

export default function ReportViewerModal({ open, reportUrl, inlineContent, title, onClose }: Props) {
  return (
    <Modal visible={open} animationType="slide">
      <View style={styles.container}>
        <Text style={rnStyleFromTokens({ size: 'lg', weight: 'semibold' }) as any}>{title ?? 'Report'}</Text>
        <ScrollView style={{ marginTop: 8 }}>
          {inlineContent ? <Text style={rnStyleFromTokens({ size: 'sm' }) as any}>{inlineContent}</Text> : null}
          {reportUrl ? <Text style={{ color: 'blue', marginTop: 8 }} onPress={() => Linking.openURL(reportUrl)}>{'Open report'}</Text> : null}
        </ScrollView>
        <View style={{ marginTop: 12 }}>
          <Button title="Close" onPress={onClose} />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 16 } })
