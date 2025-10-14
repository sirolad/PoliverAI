import React from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import rnStyleFromTokens from './rnStyleTokens'

type Evidence = { id: string, title: string }
type Props = { data?: Evidence[] }

export default function EvidenceList({ data = [] }: Props) {
  return (
    <FlatList data={data} keyExtractor={(i) => i.id} renderItem={({ item }) => (
      <View style={styles.item}><Text style={rnStyleFromTokens({ size: 'sm' }) as any}>{item.title}</Text></View>
    )} />
  )
}

const styles = StyleSheet.create({ item: { padding: 8, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' } })
