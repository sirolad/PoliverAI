import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
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
          const api = await import('./services/api')
          const txResp = await api.apiService.get(`/api/v1/transactions/${sessionId}`)

          if (txResp && typeof txResp === 'object' && 'user' in (txResp as Record<string, unknown>)) {
            try {
              const resp = txResp as Record<string, unknown>
              window.dispatchEvent(new CustomEvent('payment:user-update', { detail: resp['user'] }))
            } catch (err) {
              // ignore dispatch errors
              // eslint-disable-next-line no-console
              console.debug('CheckoutFinalizer: failed to dispatch user update', err)
            }
          }

          const result = { success: true, title: 'Purchase Complete', message: 'Your credits have been added' }
          try {
            window.dispatchEvent(new CustomEvent('payment:result', { detail: result }))
            window.dispatchEvent(new Event('payment:refresh-user'))
          } catch (err) {
            // ignore
            console.debug('CheckoutFinalizer: event dispatch failed', err)
          }

          try {
            localStorage.setItem('poliverai:payment_result', JSON.stringify(result))
            localStorage.removeItem('poliverai:pending_checkout')
          } catch (err) {
            // ignore
            console.debug('CheckoutFinalizer: localStorage access failed', err)
          }

          try {
            nav('/credits', { replace: true })
          } catch (err) {
            // Fallback to full reload if SPA navigation fails
            // use a direct navigation if SPA navigation fails
            // allow direct global navigation here as a fallback
            window.location.href = '/credits'
          }
        } catch (e) {
          // Finalize failed: notify user and request refresh of user info
          console.error('Failed to finalize checkout session', e)
          const result = { success: false, title: 'Finalize Failed', message: String(e) }
          try {
            window.dispatchEvent(new CustomEvent('payment:result', { detail: result }))
            window.dispatchEvent(new Event('payment:refresh-user'))
          } catch (err) {
            console.debug('CheckoutFinalizer: event dispatch failed on error path', err)
          }
          try {
            localStorage.setItem('poliverai:payment_result', JSON.stringify(result))
          } catch (err) {
            console.debug('CheckoutFinalizer: localStorage set failed on error path', err)
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
