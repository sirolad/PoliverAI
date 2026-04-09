import React from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { PaymentsService } from '@poliverai/intl'
import EnterCreditsModal from './EnterCreditsModal'
import { appAlphaColors, appColors } from './colorTokens'
import CrossPlatformModal from './CrossPlatformModal'

type Props = { open: boolean, onClose: () => void }

export default function InsufficientCreditsModal({ open, onClose }: Props) {
  const [enterOpen, setEnterOpen] = React.useState(false)

  return (
    <>
      <CrossPlatformModal open={open} animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.center} onPress={onClose}>
          <Pressable style={styles.box} onPress={() => undefined}>
            <Text style={styles.title}>Insufficient Credits</Text>
            <Text style={styles.description}>You do not have enough credits to perform this action.</Text>
            <View style={styles.row}>
              <Pressable style={styles.secondaryButton} onPress={onClose}>
                <Text style={styles.secondaryButtonText}>Close</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={() => setEnterOpen(true)}>
                <Text style={styles.primaryButtonText}>Top Up</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </CrossPlatformModal>
      <EnterCreditsModal
        open={enterOpen}
        onClose={() => setEnterOpen(false)}
        onConfirm={async (amountUsd) => {
          await PaymentsService.purchaseCredits(amountUsd)
        }}
      />
    </>
  )
}

const cardShadow = Platform.select({
  web: {
    boxShadow: '0 24px 56px rgba(15, 23, 42, 0.24)',
  },
  macos: undefined,
  default: {
    shadowColor: appColors.ink900,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 6,
  },
})

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: appAlphaColors.black30 },
  box: { backgroundColor: appColors.white, padding: 24, borderRadius: 20, width: '90%', maxWidth: 440, gap: 12, ...cardShadow },
  title: { fontSize: 22, fontWeight: '800', color: appColors.ink900 },
  description: { fontSize: 14, lineHeight: 20, color: appColors.slate600 },
  row: { flexDirection: 'row', justifyContent: 'flex-end' },
  primaryButton: { minHeight: 42, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: appColors.blue600 },
  primaryButtonText: { color: appColors.white, fontSize: 14, fontWeight: '800' },
  secondaryButton: { minHeight: 42, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: appColors.white, borderWidth: 1, borderColor: appColors.slate300 },
  secondaryButtonText: { color: appColors.slate600, fontSize: 14, fontWeight: '700' },
})
