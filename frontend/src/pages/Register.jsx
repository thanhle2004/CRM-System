import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Input } from '../components/ui/Input'
import Button from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const navigate = useNavigate()
  const { register: registerUser, isAuthenticated } = useAuth()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const passwordValue = watch('password')

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(values) {
    try {
      setServerError('')
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
      })
      navigate('/', { replace: true })
    } catch (error) {
      setServerError(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
            <UserPlus size={16} />
            CRM System
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Create account</h1>
          <p className="mt-2 text-sm text-gray-500">Set up an account to access your CRM dashboard.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
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
                label="Full name"
                placeholder="Jane Doe"
                error={errors.name?.message}
                {...register('name', { required: 'Name is required' })}
              />

              <Input
                label="Email"
                type="email"
                placeholder="jane@crm.local"
                error={errors.email?.message}
                {...register('email', { required: 'Email is required' })}
              />

              <Input
                label="Password"
                type="password"
                placeholder="At least 8 characters"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                })}
              />

              <Input
                label="Confirm password"
                type="password"
                placeholder="Repeat your password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === passwordValue || 'Passwords do not match',
                })}
              />

              {serverError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {serverError}
                </div>
              ) : null}

              <Button type="submit" className="w-full justify-center" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
