import React from 'react'
import { Modal, View, Text, TextInput, Button, StyleSheet } from 'react-native'

type Props = { open: boolean, initial?: string, onClose: () => void, onConfirm: (instructions?: string) => void }

export default function EnterInstructionsModal({ open, initial, onClose, onConfirm }: Props) {
  const [val, setVal] = React.useState(initial ?? '')
  return (
    <Modal visible={open} animationType="slide" transparent>
      <View style={styles.center}>
        <View style={styles.box}>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Revision Instructions</Text>
          <TextInput value={val} onChangeText={setVal} placeholder="Instructions" style={styles.input} multiline />
          <View style={styles.row}>
            <Button title="Cancel" onPress={onClose} />
            <Button title="Generate" onPress={() => onConfirm(val)} />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  box: { backgroundColor: 'white', padding: 16, borderRadius: 8, width: '90%' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 12, minHeight: 80 },
  row: { flexDirection: 'row', justifyContent: 'space-between' }
})
