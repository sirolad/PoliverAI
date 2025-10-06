import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { store } from './store/store'
import { apiService } from './services/api'
import { safeDispatch, safeDispatchMultiple } from '@/lib/eventHelpers'
import { setPaymentResult, clearPendingCheckout } from './store/paymentsSlice'
import type { PaymentResult } from './store/paymentsSlice'
import { AuthProvider } from './contexts/AuthContext'
import PaymentResultProvider from './components/ui/PaymentResultProvider'
import LandingPage from './components/LandingPage'
import { Navbar } from './components/Navbar'
import { Dashboard } from './components/Dashboard'
import PolicyAnalysis from './components/PolicyAnalysis'
import Reports from './components/Reports'
import Credits from './components/Credits'
import { Login } from './components/auth/Login'
import { Register } from './components/auth/Register'
import Footer from './components/Footer'

function App() {
  // Component to handle post-checkout finalization when returning from Stripe
  function CheckoutFinalizer() {
    const location = useLocation()
    const nav = useNavigate()

    React.useEffect(() => {
      const params = new URLSearchParams(location.search)
      const sessionId = params.get('session_id')
      if (!sessionId) return

      ;(async () => {
        try {
          const txResp = await apiService.get(`/api/v1/transactions/${sessionId}`)

          if (txResp && typeof txResp === 'object' && 'user' in (txResp as Record<string, unknown>)) {
            try {
              const resp = txResp as Record<string, unknown>
              safeDispatch('payment:user-update', resp['user'])
            } catch (e) {
              console.debug('CheckoutFinalizer: event dispatch failed', e)
            }
          }

          const result = { success: true, title: 'Purchase Complete', message: 'Your credits have been added' }
            try {
              safeDispatchMultiple([
                { name: 'payment:result', detail: result },
                { name: 'payment:refresh-user' },
              ])
            } catch (e) {
              console.debug('CheckoutFinalizer: event dispatch failed', e)
            }

            try {
            // Persist via payments slice (store subscription writes to localStorage for backward compat)
            store.dispatch(setPaymentResult(result as PaymentResult))
            store.dispatch(clearPendingCheckout())
          } catch (_err) {
            console.debug('CheckoutFinalizer: store dispatch failed', _err)
          }

          try {
            nav('/credits', { replace: true })
          } catch {
            // Fallback to full reload if SPA navigation fails
            window.location.href = '/credits'
          }
          } catch (e) {
            // Finalize failed: notify user and request refresh of user info
            console.error('Failed to finalize checkout session', e)
            const result = { success: false, title: 'Finalize Failed', message: String(e) }
              try {
                safeDispatch('payment:result', result)
                safeDispatch('payment:refresh-user')
              } catch (_err) {
                console.debug('CheckoutFinalizer: event dispatch failed on error path', _err)
              }
            try {
              store.dispatch(setPaymentResult(result as PaymentResult))
            } catch (_err) {
              console.debug('CheckoutFinalizer: store dispatch failed on error path', _err)
            }
          }
      })()
    }, [location, nav])

    return null
  }

  // Show Footer only when not on the landing page
  function FooterConditional() {
    const location = useLocation()
    if (location.pathname === '/') return null
    return <Footer />
  }

  return (
    <AuthProvider>
      <PaymentResultProvider>
        <Router>
          <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1">
              <CheckoutFinalizer />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/signup" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/analyze" element={<PolicyAnalysis />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/credits" element={<Credits />} />
              </Routes>
            </main>
            <FooterConditional />
          </div>
        </Router>
      </PaymentResultProvider>
    </AuthProvider>
  )
}

export default App
