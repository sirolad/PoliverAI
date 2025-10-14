import React from 'react'
import { View } from 'react-native'
import { Button } from '@poliverai/shared-ui'

type Props = {
  onRefresh: () => void
  onDeleteSelected: () => void
  disabled?: boolean
}

export default function BulkActions({ onRefresh, onDeleteSelected, disabled }: Props) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, padding: 12 }}>
      <Button variant="outline" onPress={onRefresh}>Refresh</Button>
      <Button variant="destructive" onPress={onDeleteSelected} disabled={disabled}>Delete selected</Button>
    </View>
  )
}
