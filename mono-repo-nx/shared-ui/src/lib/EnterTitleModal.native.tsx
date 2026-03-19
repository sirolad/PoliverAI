import React from 'react'
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

type Props = { open: boolean, initial?: string, onClose: () => void, onConfirm: (title?: string, type?: string) => void }

export default function EnterTitleModal({ open, initial, onClose, onConfirm }: Props) {
  const [title, setTitle] = React.useState(initial ?? '')

  React.useEffect(() => {
    if (open) setTitle(initial ?? '')
  }, [initial, open])

  return (
    <Modal visible={open} animationType="fade" transparent presentationStyle="overFullScreen" onRequestClose={onClose}>
      <Pressable style={styles.center} onPress={onClose}>
        <Pressable style={styles.box} onPress={() => undefined}>
          <Text style={styles.title}>Save Report</Text>
          <Text style={styles.subtitle}>Give this report a clear title so you can find it later.</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Report title" style={styles.input} placeholderTextColor="#94a3b8" />
          <View style={styles.row}>
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={() => onConfirm(title.trim() || undefined)}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

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

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  box: { backgroundColor: 'white', padding: 24, borderRadius: 20, width: '90%', maxWidth: 480, gap: 12, ...cardShadow },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, lineHeight: 20, color: '#64748b' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0f172a', backgroundColor: '#ffffff' },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' },
  secondaryButton: { minHeight: 42, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  secondaryButtonText: { color: '#475569', fontSize: 14, fontWeight: '700' },
  primaryButton: { minHeight: 42, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb' },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
})
