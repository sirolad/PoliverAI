import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
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
  // We'll use a full page navigation after finalizing checkout to refresh state

    React.useEffect(() => {
      const params = new URLSearchParams(location.search)
      const sessionId = params.get('session_id')
      if (!sessionId) return

      ;(async () => {
        try {
          const api = await import('./services/api')
          await api.apiService.post('/api/v1/checkout/complete', { session_id: sessionId })
          // Show success modal via payment result provider if available
          const result = { success: true, title: 'Purchase Complete', message: 'Your credits have been added' }
          try {
            // Dispatch event for any in-memory listeners
            window.dispatchEvent(new CustomEvent('payment:result', { detail: result }))
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
          // Navigate to credits page to show updated balance and transactions
          window.location.href = '/credits'
        } catch (e) {
          console.error('Failed to finalize checkout session', e)
          const result = { success: false, title: 'Finalize Failed', message: String(e) }
          try {
            window.dispatchEvent(new CustomEvent('payment:result', { detail: result }))
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
  }, [location])
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
