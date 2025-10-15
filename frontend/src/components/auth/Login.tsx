import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
<<<<<<< HEAD
import { t } from '@/i18n'
import { twFromTokens, textSizes, colors, fontWeights, hoverFromColor, spacing, alignment } from '@/styles/styleTokens'
import { Button } from '@/components/ui/Button'
import LoadingLabel from '@/components/ui/LoadingLabel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import FormField from '@/components/ui/FormField'
import useAuth from '@/contexts/useAuth'
import { Mail, Lock, AlertCircle, LogIn } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email(t('auth.register.validation_email')),
  password: z.string().min(6, t('auth.register.validation_password_min')),
=======
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
>>>>>>> main
})

type LoginForm = z.infer<typeof loginSchema>

export function Login() {
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsSubmitting(true)
      setError('')
      await login(data.email, data.password)
      navigate('/dashboard')
<<<<<<< HEAD
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else if (typeof err === 'string') {
        setError(err)
      } else {
        setError('Login failed')
      }
=======
    } catch (error: any) {
      setError(error.message)
>>>>>>> main
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
<<<<<<< HEAD
      <div className={twFromTokens(spacing.fullScreenCenter)}>
        <div className={twFromTokens('animate-spin rounded-full', 'h-12 w-12', colors.primary)} />
=======
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
>>>>>>> main
      </div>
    )
  }

  return (
<<<<<<< HEAD
    <div className={twFromTokens(spacing.fullScreenCenter, colors.pageBg, 'py-12 px-4 sm:px-6 lg:px-8')}>
      <div className={twFromTokens(spacing.containerMaxMd, alignment.gap4)}>
        <div className={twFromTokens(alignment.centerColumnMargined)}>
          <img src="/poliverai-icon-transparent.svg" alt="PoliverAI" className={twFromTokens('h-48', 'mx-auto')} />
          <h2 className={twFromTokens(spacing.sectionButtonTop, fontWeights.bold, textSizes.h2, colors.textPrimary)}>{t('auth_login.welcome_title')}</h2>
          <p className={twFromTokens(spacing.tinyTop, textSizes.sm, colors.textMuted)}>
            {t('auth_login.welcome_subtitle')}
=======
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome back to PoliverAI</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your GDPR compliance dashboard
>>>>>>> main
          </p>
        </div>

        <Card>
          <CardHeader>
<<<<<<< HEAD
            <CardTitle>{t('auth_login.sign_in_title')}</CardTitle>
            <CardDescription>
              {t('auth_login.sign_in_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className={twFromTokens(alignment.flexCol, alignment.gap4)}>
              {error && (
                <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2, spacing.cardDefault, colors.danger, colors.dangerBg, 'rounded-md', textSizes.sm)}>
                  <AlertCircle className={twFromTokens(spacing.iconsXs, colors.danger)} />
=======
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  <AlertCircle className="h-4 w-4" />
>>>>>>> main
                  {error}
                </div>
              )}

<<<<<<< HEAD
              <FormField id="email" label={t('auth.register.email_label')} icon={<Mail className={twFromTokens(colors.mutedText, 'h-4')} />} error={errors.email?.message}>
                <Input id="email" type="email" placeholder={t('auth.register.email_placeholder')} className="pl-10" {...register('email')} />
              </FormField>

              <FormField id="password" label={t('auth.register.password_label')} icon={<Lock className={twFromTokens(colors.mutedText, 'h-4')} />} error={errors.password?.message}>
                <Input id="password" type="password" placeholder={t('auth.register.password_placeholder')} className="pl-10" {...register('password')} />
              </FormField>

              <Button
                type="submit"
                className={twFromTokens(textSizes.sm, colors.primaryBg, spacing.fullWidth, alignment.center, alignment.gap2)}
                disabled={isSubmitting}
                icon={<LogIn className={twFromTokens(spacing.iconsXs, textSizes.sm)} />}
              >
                <LoadingLabel
                  loading={isSubmitting}
                  loadingNode={t('auth_login.signing_in')}
                  normalNode={t('auth_login.sign_in_cta')}
                />
              </Button>

              <div className="text-center">
                <p className={twFromTokens(textSizes.sm, colors.textMuted)}>
                  {t('auth_login.no_account_prefix')}{' '}
                  <Link to="/register" className={twFromTokens(textSizes.sm, fontWeights.medium, alignment.itemsCenter, alignment.gap2, 'transition-colors', colors.primary, hoverFromColor(colors.primary))}>
                    {t('auth_login.sign_up_cta')}
=======
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                    Sign up for free
>>>>>>> main
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
