import React from 'react'
import { ScrollView, View, Text } from 'react-native'
import { NoDataView } from '@poliverai/shared-ui'

export default function DashboardScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Dashboard</Text>
      <NoDataView title="Welcome" message="This is the dashboard placeholder." />
    </ScrollView>
  )
}
