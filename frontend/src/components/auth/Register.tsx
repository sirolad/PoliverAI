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
import { Mail, Lock, User, AlertCircle, UserPlus } from 'lucide-react'

const registerSchema = z.object({
  name: z.string().min(2, t('auth.register.validation_name_min')),
  email: z.string().email(t('auth.register.validation_email')),
  password: z.string().min(6, t('auth.register.validation_password_min')),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('auth.register.validation_password_match'),
=======
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { Shield, Mail, Lock, User, AlertCircle } from 'lucide-react'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
>>>>>>> main
  path: ["confirmPassword"],
})

type RegisterForm = z.infer<typeof registerSchema>

export function Register() {
  const { register: registerUser, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsSubmitting(true)
      setError('')
      await registerUser(data.name, data.email, data.password)
      navigate('/dashboard')
<<<<<<< HEAD
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else if (typeof err === 'string') {
        setError(err)
      } else {
        setError('Registration failed')
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
          <h2 className={twFromTokens(spacing.sectionButtonTop, fontWeights.bold, textSizes.h2, colors.textPrimary)}>{t('auth.register.join_title')}</h2>
          <p className={twFromTokens(spacing.tinyTop, textSizes.sm, colors.textMuted)}>
            {t('auth.register.join_subtitle')}
=======
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Join PoliverAI</h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account and start ensuring GDPR compliance
>>>>>>> main
          </p>
        </div>

        <Card>
          <CardHeader>
<<<<<<< HEAD
            <CardTitle>{t('auth.register.create_account')}</CardTitle>
            <CardDescription>
              {t('auth.register.create_account_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className={twFromTokens(alignment.flexCol, alignment.gap4)}>
              {error && (
                <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2, spacing.cardDefault, colors.danger, colors.dangerBg, 'rounded-md', textSizes.sm)}>
                  <AlertCircle className={twFromTokens(spacing.iconsXs, colors.danger)} />
=======
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Get started with your free PoliverAI account
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
              <FormField id="name" label={t('auth.register.name_label')} icon={<User className={twFromTokens(colors.mutedText, 'h-4')} />} error={errors.name?.message}>
                <Input id="name" type="text" placeholder={t('auth.register.name_placeholder')} className="pl-10" {...register('name')} />
              </FormField>

              <FormField id="email" label={t('auth.register.email_label')} icon={<Mail className={twFromTokens(colors.mutedText, 'h-4')} />} error={errors.email?.message}>
                <Input id="email" type="email" placeholder={t('auth.register.email_placeholder')} className="pl-10" {...register('email')} />
              </FormField>

              <FormField id="password" label={t('auth.register.password_label')} icon={<Lock className={twFromTokens(colors.mutedText, 'h-4')} />} error={errors.password?.message}>
                <Input id="password" type="password" placeholder={t('auth.register.password_placeholder')} className="pl-10" {...register('password')} />
              </FormField>

              <FormField id="confirmPassword" label={t('auth.register.confirm_password_label')} icon={<Lock className={twFromTokens(colors.mutedText, 'h-4')} />} error={errors.confirmPassword?.message}>
                <Input id="confirmPassword" type="password" placeholder={t('auth.register.confirm_password_placeholder')} className="pl-10" {...register('confirmPassword')} />
              </FormField>

              <div className={twFromTokens(textSizes.sm, colors.textMuted)}>
                {t('auth.register.terms_prefix')}{' '}
                <a href="#" className={twFromTokens(fontWeights.medium, alignment.gap2, 'transition-colors', colors.primary, hoverFromColor(colors.primary))}>{t('auth.register.terms')}</a>{' '}
                and{' '}
                <a href="#" className={twFromTokens(fontWeights.medium, alignment.gap2, 'transition-colors', colors.primary, hoverFromColor(colors.primary))}>{t('auth.register.privacy')}</a>.
              </div>

                <Button
                type="submit"
                className={twFromTokens(textSizes.sm, colors.primaryBg, spacing.fullWidth, alignment.center, alignment.gap2)}
                disabled={isSubmitting}
                icon={<UserPlus className={twFromTokens(spacing.iconsXs, textSizes.sm)} />}
              >
                <LoadingLabel
                  loading={isSubmitting}
                  loadingNode={t('auth.register.creating_account')}
                  normalNode={t('auth.register.create_account_cta')}
                />
              </Button>

              <div className={twFromTokens(alignment.center)}>
                  <p className={twFromTokens(textSizes.sm, colors.textMuted)}>
                    {t('auth.register.already_have_account')}{' '}
                    <Link to="/login" className={twFromTokens(textSizes.sm, fontWeights.medium, alignment.itemsCenter, alignment.gap2, 'transition-colors', colors.primary, hoverFromColor(colors.primary))}>
                      {t('auth.register.sign_in')}
                    </Link>
                  </p>
=======
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-10"
                    {...register('name')}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

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
                    placeholder="Create a password"
                    className="pl-10"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    className="pl-10"
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="text-xs text-gray-600">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>.
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                    Sign in
                  </Link>
                </p>
>>>>>>> main
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
