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

function App() {
  // Component to handle post-checkout finalization when returning from Stripe
  function CheckoutFinalizer() {
    const location = useLocation()
  const nav = useNavigate()
    // We'll use SPA navigation after finalizing checkout to keep the app state
    // and allow the modal to display without a full page reload.

    React.useEffect(() => {
      console.debug('CheckoutFinalizer effect running, location=', location)
      const params = new URLSearchParams(location.search)
      const sessionId = params.get('session_id')
      console.debug('CheckoutFinalizer parsed session_id=', sessionId)
      if (!sessionId) return

      ;(async () => {
        try {
          const api = await import('./services/api')
          // Prefer the transaction check endpoint which will look up the
          // pending transaction persisted at checkout creation and finalize it
          // (update user credits and mark transaction completed) if Stripe
          // reports the session as paid. This avoids duplicating logic.
          const txResp = await api.apiService.get(`/api/v1/transactions/${sessionId}`)
          // If the finalize endpoint returned an updated user object, dispatch it for immediate UI update
          if (txResp && (txResp as any).user) {
            try {
              window.dispatchEvent(new CustomEvent('payment:user-update', { detail: (txResp as any).user }))
            } catch {
              // ignore
            }
          }
          // Show success modal via payment result provider if available
          const result = { success: true, title: 'Purchase Complete', message: 'Your credits have been added' }
          try {
            // Dispatch event for any in-memory listeners
            window.dispatchEvent(new CustomEvent('payment:result', { detail: result }))
            // Notify app to refresh user info (Navbar/AuthContext can listen)
            window.dispatchEvent(new Event('payment:refresh-user'))
          } catch {
            // ignore
          }
          try {
            // Persist result so pages that mount after navigation can read it and show the modal
            localStorage.setItem('poliverai:payment_result', JSON.stringify(result))
          } catch {
            // ignore
          }
          try {
            // Clear pending checkout cache
            localStorage.removeItem('poliverai:pending_checkout')
          } catch {
            // ignore
          }
          // Navigate within the SPA so listeners and persisted data remain available
          try {
            nav('/credits', { replace: true })
          } catch {
            // Fallback to full reload if SPA navigation fails
            window.location.href = '/credits'
          }
        } catch (e) {
          console.error('Failed to finalize checkout session', e)
          const result = { success: false, title: 'Finalize Failed', message: String(e) }
          try {
            window.dispatchEvent(new CustomEvent('payment:result', { detail: result }))
            window.dispatchEvent(new Event('payment:refresh-user'))
          } catch {
            // ignore
          }
          try {
            localStorage.setItem('poliverai:payment_result', JSON.stringify(result))
          } catch {
            // ignore
          }
        }
      })()
  }, [location, nav])
    return null
  }
  return (
    <AuthProvider>
      <PaymentResultProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Navbar />
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
        </div>
      </Router>
      </PaymentResultProvider>
    </AuthProvider>
  )
}

export default App
