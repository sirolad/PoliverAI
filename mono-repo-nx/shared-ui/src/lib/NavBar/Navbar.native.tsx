import { } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useAuth } from '@poliverai/intl'
import { useTranslation } from '@poliverai/intl'
import rnStyleFromTokens from '../rnStyleTokens'
import Button from '../Button.native'

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const { t } = useTranslation()

  return (
    <View style={styles.nav}>
      <View style={styles.container}>
        <Text style={[styles.brand, rnStyleFromTokens({ size: 'lg', weight: 'bold' })]}>PoliverAI</Text>

        <View style={styles.links}>
          {isAuthenticated && (
            <>
              <TouchableOpacity style={styles.link}><Text>{t('nav.reports', 'Reports')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.link}><Text>{t('nav.analysis', 'Analyze')}</Text></TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.actions}>
          {!isAuthenticated ? (
            <>
              <Button title={t('nav.login', 'Log in')} onPress={() => { /* navigate handled by app shell */ }} variant="ghost" />
              <Button title={t('nav.signup', 'Sign up')} onPress={() => {}} style={{ marginLeft: 8 }} />
            </>
          ) : (
            <>
              <Text style={styles.userName}>{user?.name ?? user?.email}</Text>
              <Button title={t('nav.logout', 'Log out')} onPress={() => logout()} variant="outline" style={{ marginLeft: 8 }} />
            </>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  nav: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16 },
  brand: { fontSize: 20, color: '#2563eb' },
  links: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  link: { marginHorizontal: 8 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  userName: { marginRight: 8, fontWeight: '700' },
})
