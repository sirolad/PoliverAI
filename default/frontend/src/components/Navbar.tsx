import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { Shield, User, LogOut } from 'lucide-react'

export function Navbar() {
  const { user, logout, isAuthenticated, isPro } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <Shield className="h-6 w-6 text-blue-600" />
          <span>PoliverAI</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          {isAuthenticated && (
            <>
              <Link
                to="/dashboard"
                className="text-sm font-medium hover:text-blue-600 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/analyze"
                className="text-sm font-medium hover:text-blue-600 transition-colors"
              >
                Analyze Policy
              </Link>
              {isPro && (
                <Link
                  to="/reports"
                  className="text-sm font-medium hover:text-blue-600 transition-colors"
                >
                  Reports
                </Link>
              )}
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              {/* User tier badge */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{user?.name}</span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    isPro
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {isPro ? 'PRO' : 'FREE'}
                </span>
              </div>

              {/* Upgrade button for free users */}
              {!isPro && (
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Upgrade to Pro
                </Button>
              )}

              {/* Logout button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLogout}
                className="flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
