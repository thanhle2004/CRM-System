import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, RefreshCw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { getCustomer, updateCustomer } from '../api/customers'
import { rescoreCustomer } from '../api/churn'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge, { churnRiskBadge } from '../components/ui/Badge'
import { Input, Select } from '../components/ui/Input'
import { PageLoader } from '../components/ui/Spinner'
import { fmtCurrency, fmtNumber, fmtPercent } from '../lib/utils'

export default function CustomerDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const qc       = useQueryClient()

  const [editing, setEditing] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomer(id),
  })

  const updateMut = useMutation({
    mutationFn: (payload) => updateCustomer(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', id] })
      setEditing(false)
    },
  })

  const rescoreMut = useMutation({
    mutationFn: () => rescoreCustomer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', id] }),
  })

  const { register, handleSubmit } = useForm()

  if (isLoading) return <PageLoader />
  if (error)     return <div className="p-8 text-red-500 text-sm">{error.message}</div>

  const c = data?.data ?? {}

  const onSubmit = (formData) => {
    const payload = {}
    Object.entries(formData).forEach(([k, v]) => {
      if (v !== '' && v != null) {
        payload[k] = isNaN(v) ? v : (typeof v === 'string' ? (v.includes('.') ? parseFloat(v) : parseInt(v, 10) || v) : v)
      }
    })
    updateMut.mutate(payload)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/customers')}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{c.full_name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{c.email}</p>
        </div>
        <div className="flex items-center gap-3">
          {churnRiskBadge(c.churn_risk)}
          <Badge variant={c.churned ? 'danger' : 'success'}>
            {c.churned ? 'Churned' : 'Active'}
          </Badge>
          <Button
            variant="secondary"
            size="sm"
            disabled={rescoreMut.isPending}
            onClick={() => rescoreMut.mutate()}
          >
            <RefreshCw size={14} /> Rescore
          </Button>
          <Button size="sm" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </div>

      {editing ? (
        <EditForm c={c} register={register} handleSubmit={handleSubmit} onSubmit={onSubmit} mutation={updateMut} />
      ) : (
        <ReadView c={c} />
      )}
    </div>
  )
}

function ReadView({ c }) {
  const sections = [
    {
      title: 'Personal Info',
      rows: [
        ['Full Name', c.full_name],
        ['Email', c.email],
        ['Phone', c.phone],
        ['Age', c.age],
        ['Gender', c.gender],
        ['Country', c.country],
        ['City', c.city],
      ],
    },
    {
      title: 'Membership',
      rows: [
        ['Membership Years', c.membership_years],
        ['Signup Quarter', c.signup_quarter],
        ['Credit Balance', fmtCurrency(c.credit_balance)],
      ],
    },
    {
      title: 'Financials',
      rows: [
        ['Lifetime Value', fmtCurrency(c.lifetime_value)],
        ['Avg Order Value', fmtCurrency(c.average_order_value)],
        ['Total Purchases', fmtNumber(c.total_purchases)],
        ['Days Since Last Purchase', fmtNumber(c.days_since_last_purchase)],
        ['Cart Abandonment Rate', fmtPercent(c.cart_abandonment_rate)],
        ['Discount Usage Rate', fmtPercent(c.discount_usage_rate)],
        ['Returns Rate', fmtPercent(c.returns_rate)],
      ],
    },
    {
      title: 'Engagement',
      rows: [
        ['Engagement Score', fmtNumber(c.engagement_score, 1)],
        ['Login Frequency', `${fmtNumber(c.login_frequency, 1)} / month`],
        ['Session Duration', `${fmtNumber(c.session_duration_avg, 1)} min`],
        ['Pages per Session', fmtNumber(c.pages_per_session, 1)],
        ['Email Open Rate', fmtPercent(c.email_open_rate * 100)],
        ['Mobile App Usage', fmtPercent(c.mobile_app_usage)],
        ['Social Engagement', fmtNumber(c.social_media_engagement_score)],
        ['Reviews Written', fmtNumber(c.product_reviews_written)],
      ],
    },
    {
      title: 'Churn',
      rows: [
        ['Churn Score', fmtNumber(c.churn_score)],
        ['Churn Risk', c.churn_risk],
        ['Churned', c.churned ? 'Yes' : 'No'],
        ['Customer Service Calls', fmtNumber(c.customer_service_calls)],
      ],
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {sections.map((s) => (
        <Card key={s.title}>
          <CardHeader>
            <CardTitle>{s.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {s.rows.map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm py-0.5">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-800 text-right ml-4">{value ?? '—'}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Marketing actions */}
      {c.marketing_actions?.length > 0 && (
        <Card className="lg:col-span-2 xl:col-span-3">
          <CardHeader>
            <CardTitle>Marketing Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-50">
              {c.marketing_actions.map((a, i) => (
                <div key={i} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-800">{a.action}</span>
                    {a.reason && <span className="text-gray-400 ml-2">— {a.reason}</span>}
                  </div>
                  <span className="text-gray-400 text-xs">{new Date(a.triggered_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function EditForm({ c, register, handleSubmit, onSubmit, mutation }) {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {mutation.error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{mutation.error.message}</div>
      )}

      <Card>
        <CardHeader><CardTitle>Edit Customer</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="First Name" defaultValue={c.first_name} {...register('first_name')} />
            <Input label="Last Name"  defaultValue={c.last_name}  {...register('last_name')}  />
            <Input label="Email" type="email" defaultValue={c.email} {...register('email')} />
            <Input label="Phone" defaultValue={c.phone} {...register('phone')} />
            <Input label="Age" type="number" defaultValue={c.age} {...register('age')} />
            <Input label="Country" defaultValue={c.country} {...register('country')} />
            <Input label="City" defaultValue={c.city} {...register('city')} />
            <Input label="Lifetime Value" type="number" defaultValue={c.lifetime_value} {...register('lifetime_value')} />
            <Input label="Total Purchases" type="number" defaultValue={c.total_purchases} {...register('total_purchases')} />
            <Input label="Days Since Last Purchase" type="number" defaultValue={c.days_since_last_purchase} {...register('days_since_last_purchase')} />
            <Input label="Login Frequency" type="number" defaultValue={c.login_frequency} {...register('login_frequency')} />
            <Input label="Session Duration (min)" type="number" defaultValue={c.session_duration_avg} {...register('session_duration_avg')} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          <Save size={16} /> {mutation.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
