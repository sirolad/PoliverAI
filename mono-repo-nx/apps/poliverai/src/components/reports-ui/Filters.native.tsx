import React from 'react'
import { View, Text } from 'react-native'
import { Input } from '@poliverai/shared-ui'

type Props = {
  query: string
  setQuery: (s: string) => void
  statusFilter: string | null
  setStatusFilter: (s: string | null) => void
}

export default function Filters({ query, setQuery }: Props) {
  return (
    <View style={{ padding: 12 }}>
      <Text style={{ fontWeight: '600', marginBottom: 8 }}>Search</Text>
      <Input value={query} onChangeText={setQuery} placeholder="Search reports" />
    </View>
  )
}
