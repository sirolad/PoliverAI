import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { t } from '@/i18n'
import { twFromTokens, textSizes, colors, fontWeights, hoverFromColor, spacing, alignment } from '@/styles/styleTokens'
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
      <div className={twFromTokens(spacing.fullScreenCenter)}>
        <div className={twFromTokens('animate-spin rounded-full', 'h-12 w-12', colors.primary)} />
      </div>
    )
  }

  return (
    <div className={twFromTokens(spacing.fullScreenCenter, colors.pageBg, 'py-12 px-4 sm:px-6 lg:px-8')}>
      <div className={twFromTokens(spacing.containerMaxMd, alignment.gap4)}>
        <div className={twFromTokens(alignment.centerColumn)}>
          <img src="/poliverai-icon-transparent.svg" alt="PoliverAI" className={twFromTokens('h-48', 'mx-auto')} />
          <h2 className={twFromTokens(spacing.sectionButtonTop, fontWeights.bold, textSizes.h1, colors.textPrimary)}>{t('auth.register.join_title')}</h2>
          <p className={twFromTokens(spacing.tinyTop, textSizes.sm, colors.textMuted)}>
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
            <form onSubmit={handleSubmit(onSubmit)} className={twFromTokens(alignment.flexCol, alignment.gap4)}>
              {error && (
                <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2, spacing.cardDefault, colors.danger, colors.dangerBg, 'rounded-md', textSizes.sm)}>
                  <AlertCircle className={twFromTokens(spacing.iconsXs, colors.danger)} />
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

              <div className={twFromTokens(textSizes.sm, colors.textMuted)}>
                {t('auth.register.terms_prefix')}{' '}
                <a href="#" className={twFromTokens(fontWeights.medium, alignment.flexRow, alignment.itemsCenter, alignment.gap2, 'transition-colors', colors.primary, hoverFromColor(colors.primary))}>{t('auth.register.terms')}</a>{' '}
                and{' '}
                <a href="#" className={twFromTokens(fontWeights.medium, alignment.flexRow, alignment.itemsCenter, alignment.gap2, 'transition-colors', colors.primary, hoverFromColor(colors.primary))}>{t('auth.register.privacy')}</a>.
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
                    <Link to="/login" className={twFromTokens(textSizes.sm, fontWeights.medium, alignment.flexRow, alignment.itemsCenter, alignment.gap2, 'transition-colors', colors.primary, hoverFromColor(colors.primary))}>
                      <LogIn className={twFromTokens(spacing.iconsXs)} />
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
