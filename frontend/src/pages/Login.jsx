import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Input } from '../components/ui/Input'
import Button from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated } = useAuth()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const redirectTo = location.state?.from?.pathname || '/'

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  async function onSubmit(values) {
    try {
      setServerError('')
      await login(values)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setServerError(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
            <LogIn size={16} />
            CRM System
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-500">Sign in to continue managing your CRM workspace.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              noValidate
              method="post"
              onSubmit={(event) => {
                event.preventDefault()
                void handleSubmit(onSubmit)(event)
              }}
              className="space-y-4"
            >
              <Input
                label="Email"
                type="email"
                placeholder="admin@crm.local"
                error={errors.email?.message}
                {...register('email', { required: 'Email is required' })}
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                error={errors.password?.message}
                {...register('password', { required: 'Password is required' })}
              />

              {serverError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {serverError}
                </div>
              ) : null}

              <Button type="submit" className="w-full justify-center" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-500">
              Need an account?{' '}
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
