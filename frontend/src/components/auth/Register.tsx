import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { t } from '@/i18n'
import { Button } from '@/components/ui/Button'
import LoadingLabel from '@/components/ui/LoadingLabel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import FormField from '@/components/ui/FormField'
import useAuth from '@/contexts/useAuth'
import { Mail, Lock, User, AlertCircle, UserPlus, LogIn } from 'lucide-react'

const registerSchema = z.object({
  name: z.string().min(2, t('auth.register.validation_name_min')),
  email: z.string().email(t('auth.register.validation_email')),
  password: z.string().min(6, t('auth.register.validation_password_min')),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('auth.register.validation_password_match'),
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else if (typeof err === 'string') {
        setError(err)
      } else {
        setError('Registration failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img src="/poliverai-icon-transparent.svg" alt="PoliverAI" className="h-48 mx-auto" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">{t('auth.register.join_title')}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('auth.register.join_subtitle')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('auth.register.create_account')}</CardTitle>
            <CardDescription>
              {t('auth.register.create_account_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <FormField id="name" label={t('auth.register.name_label')} icon={<User />} error={errors.name?.message}>
                <Input id="name" type="text" placeholder={t('auth.register.name_placeholder')} className="pl-10" {...register('name')} />
              </FormField>

              <FormField id="email" label={t('auth.register.email_label')} icon={<Mail />} error={errors.email?.message}>
                <Input id="email" type="email" placeholder={t('auth.register.email_placeholder')} className="pl-10" {...register('email')} />
              </FormField>

              <FormField id="password" label={t('auth.register.password_label')} icon={<Lock />} error={errors.password?.message}>
                <Input id="password" type="password" placeholder={t('auth.register.password_placeholder')} className="pl-10" {...register('password')} />
              </FormField>

              <FormField id="confirmPassword" label={t('auth.register.confirm_password_label')} icon={<Lock />} error={errors.confirmPassword?.message}>
                <Input id="confirmPassword" type="password" placeholder={t('auth.register.confirm_password_placeholder')} className="pl-10" {...register('confirmPassword')} />
              </FormField>

              <div className="text-xs text-gray-600">
                {t('auth.register.terms_prefix')}{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">{t('auth.register.terms')}</a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">{t('auth.register.privacy')}</a>.
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                disabled={isSubmitting}
                icon={<UserPlus className="h-4 w-4" />}
              >
                <LoadingLabel
                  loading={isSubmitting}
                  loadingNode={t('auth.register.creating_account')}
                  normalNode={t('auth.register.create_account_cta')}
                />
              </Button>

              <div className="text-center">
                  <p className="text-sm text-gray-600">
                    {t('auth.register.already_have_account')}{' '}
                    <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 inline-flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      {t('auth.register.sign_in')}
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
