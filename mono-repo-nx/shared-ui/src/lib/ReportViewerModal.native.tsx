import React from 'react'
import { Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import rnStyleFromTokens from './rnStyleTokens'

type Props = { open: boolean, reportUrl?: string, filename?: string | null, inlineContent?: string | null, title?: string, onClose: () => void }

const cardShadow = Platform.select({
  web: {
    boxShadow: '0 24px 56px rgba(15, 23, 42, 0.24)',
  },
  default: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 6,
  },
})

export default function ReportViewerModal({ open, reportUrl, inlineContent, title, onClose }: Props) {
  const handleOpen = React.useCallback(async () => {
    if (!reportUrl) return
    await Linking.openURL(reportUrl)
  }, [reportUrl])

  return (
    <Modal visible={open} animationType="fade" transparent presentationStyle="overFullScreen" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={rnStyleFromTokens({ size: 'lg', weight: 'semibold' }) as any}>{title ?? 'Report'}</Text>
              <Text style={styles.subtitle}>Preview and open the generated report.</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {inlineContent ? <Text style={rnStyleFromTokens({ size: 'sm' }) as any}>{inlineContent}</Text> : null}
            {reportUrl ? (
              <View style={styles.urlCard}>
                <Text style={styles.urlLabel}>Report link</Text>
                <Text selectable style={styles.urlValue}>{reportUrl}</Text>
              </View>
            ) : null}
            {!inlineContent && !reportUrl ? (
              <Text style={styles.emptyText}>No report content is available for preview yet.</Text>
            ) : null}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Close</Text>
            </Pressable>
            <Pressable onPress={() => { void handleOpen() }} style={[styles.primaryButton, !reportUrl ? styles.primaryButtonDisabled : null]} disabled={!reportUrl}>
              <Text style={styles.primaryButtonText}>Open report</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 760,
    maxHeight: '88%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    gap: 18,
    ...cardShadow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  closeButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    gap: 14,
  },
  urlCard: {
    borderWidth: 1,
    borderColor: '#dbe7f5',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  urlLabel: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  urlValue: {
    color: '#1d4ed8',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    flexWrap: 'wrap',
  },
  secondaryButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
  },
  primaryButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
})
