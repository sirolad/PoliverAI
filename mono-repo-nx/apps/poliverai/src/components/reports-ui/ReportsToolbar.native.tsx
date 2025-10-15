import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Button } from '@poliverai/shared-ui'

type Props = {
  total?: number | null
  page: number
  setPage: (n: number) => void
  limit: number
  setLimit: (n: number) => void
  onSelectAll?: () => void
}

export default function ReportsToolbar({ total, page, setPage, limit, setLimit, onSelectAll }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Button variant="ghost" size="sm" onPress={() => onSelectAll && onSelectAll()}>
          Select all
        </Button>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => setPage(Math.max(1, page - 1))} style={{ marginRight: 8 }}>
          <Text>Prev</Text>
        </TouchableOpacity>
        <Text style={{ marginHorizontal: 8 }}>{page}</Text>
        <TouchableOpacity onPress={() => setPage(page + 1)} style={{ marginLeft: 8 }}>
          <Text>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
