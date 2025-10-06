import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import LoadingLabel from '@/components/ui/LoadingLabel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import FormField from '@/components/ui/FormField'
import useAuth from '@/contexts/useAuth'
import { Mail, Lock, User, AlertCircle, UserPlus, LogIn } from 'lucide-react'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
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
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Join PoliverAI</h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account and start ensuring GDPR compliance
          </p>
        </div>

        <Card>
          <CardHeader>
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
                  {error}
                </div>
              )}

              <FormField id="name" label="Full Name" icon={<User />} error={errors.name?.message}>
                <Input id="name" type="text" placeholder="Enter your full name" className="pl-10" {...register('name')} />
              </FormField>

              <FormField id="email" label="Email address" icon={<Mail />} error={errors.email?.message}>
                <Input id="email" type="email" placeholder="Enter your email" className="pl-10" {...register('email')} />
              </FormField>

              <FormField id="password" label="Password" icon={<Lock />} error={errors.password?.message}>
                <Input id="password" type="password" placeholder="Create a password" className="pl-10" {...register('password')} />
              </FormField>

              <FormField id="confirmPassword" label="Confirm Password" icon={<Lock />} error={errors.confirmPassword?.message}>
                <Input id="confirmPassword" type="password" placeholder="Confirm your password" className="pl-10" {...register('confirmPassword')} />
              </FormField>

              <div className="text-xs text-gray-600">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>.
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                <LoadingLabel
                  loading={isSubmitting}
                  loadingNode={<><UserPlus className="h-4 w-4"/> Creating account...</>}
                  normalNode={<><UserPlus className="h-4 w-4"/> Create Account</>}
                />
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 inline-flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign in
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
