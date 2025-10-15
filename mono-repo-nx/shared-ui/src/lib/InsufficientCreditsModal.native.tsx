import React from 'react'
import { Modal, View, Text, Button, StyleSheet } from 'react-native'

type Props = { open: boolean, onClose: () => void }

export default function InsufficientCreditsModal({ open, onClose }: Props) {
  return (
    <Modal visible={open} animationType="fade" transparent>
      <View style={styles.center}>
        <View style={styles.box}>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Insufficient Credits</Text>
          <Text style={{ marginBottom: 12 }}>You do not have enough credits to perform this action.</Text>
          <Button title="Close" onPress={onClose} />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  box: { backgroundColor: 'white', padding: 16, borderRadius: 8, width: '90%' }
})
