import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

type Props = {
  isCompactUnderHeader?: boolean
  statsLoaded?: boolean
  animatedTop?: any
  subscriptionUsd?: number
  purchasedUsd?: number
  spentUsd?: number
  total?: number
  mobileCompact?: boolean
}

const CreditsSummary: React.FC<Props> = ({ subscriptionUsd = 0, purchasedUsd = 0, spentUsd = 0 }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.line}>Subscription: ${subscriptionUsd.toFixed(2)}</Text>
      <Text style={styles.line}>Purchased: ${purchasedUsd.toFixed(2)}</Text>
      <Text style={styles.line}>Spent: ${spentUsd.toFixed(2)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 12 },
  line: { fontSize: 14, color: '#111827', marginBottom: 6 }
})

export default CreditsSummary
