import React from 'react'
import { Modal, View, Text, TextInput, Button, StyleSheet } from 'react-native'

type Props = { open: boolean, initial?: string, onClose: () => void, onConfirm: (title?: string, type?: string) => void }

export default function EnterTitleModal({ open, initial, onClose, onConfirm }: Props) {
  const [title, setTitle] = React.useState(initial ?? '')
  return (
    <Modal visible={open} animationType="slide" transparent>
      <View style={styles.center}>
        <View style={styles.box}>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Save Report</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Report title" style={styles.input} />
          <View style={styles.row}>
            <Button title="Cancel" onPress={onClose} />
            <Button title="Save" onPress={() => onConfirm(title)} />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  box: { backgroundColor: 'white', padding: 16, borderRadius: 8, width: '90%' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' }
})
