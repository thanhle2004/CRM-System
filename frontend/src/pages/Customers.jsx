import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Trash2, Eye, RefreshCw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { getCustomers, createCustomer, deleteCustomer } from '../api/customers'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge, { churnRiskBadge } from '../components/ui/Badge'
import Pagination from '../components/ui/Pagination'
import Modal from '../components/ui/Modal'
import { Input, Select } from '../components/ui/Input'
import { PageLoader } from '../components/ui/Spinner'
import { fmtCurrency, fmtNumber } from '../lib/utils'

const COUNTRIES = ['','United States','United Kingdom','Canada','Australia','Germany','France','India','Brazil','Japan','Mexico']

export default function Customers() {
  const navigate     = useNavigate()
  const qc           = useQueryClient()

  const [page,    setPage]    = useState(1)
  const [search,  setSearch]  = useState('')
  const [country, setCountry] = useState('')
  const [churned, setChurned] = useState('')
  const [risk,    setRisk]    = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId,   setDeleteId]   = useState(null)

  const params = {
    page, limit: 20,
    ...(search  && { search }),
    ...(country && { country }),
    ...(churned !== '' && { churned }),
    ...(risk    && { churn_risk: risk }),
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', params],
    queryFn: () => getCustomers(params),
    keepPreviousData: true,
  })

  const deleteMut = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      setDeleteId(null)
    },
  })

  const customers  = data?.data ?? []
  const pagination = data?.pagination ?? {}

  const handleSearch = useCallback((e) => {
    setSearch(e.target.value)
    setPage(1)
  }, [])

  if (isLoading && !data) return <PageLoader />

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pagination.total != null ? `${fmtNumber(pagination.total)} total` : ''}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Customer
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search name or email…"
              value={search}
              onChange={handleSearch}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={country}
            onChange={(e) => { setCountry(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Countries</option>
            {COUNTRIES.filter(Boolean).map((c) => <option key={c}>{c}</option>)}
          </select>

          <select
            value={churned}
            onChange={(e) => { setChurned(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Status</option>
            <option value="false">Active</option>
            <option value="true">Churned</option>
          </select>

          <select
            value={risk}
            onChange={(e) => { setRisk(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Risk Levels</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-red-500 text-sm">{error.message}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Name','Email','Country','LTV','Engagement','Churn Risk','Status',''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                        No customers found
                      </td>
                    </tr>
                  ) : customers.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {c.full_name}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{c.email}</td>
                      <td className="px-4 py-3 text-gray-500">{c.country}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {fmtCurrency(c.lifetime_value)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[80px] bg-gray-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-indigo-500"
                              style={{ width: `${Math.min(c.engagement_score, 100)}%` }}
                            />
                          </div>
                          <span className="text-gray-600 text-xs w-6">{fmtNumber(c.engagement_score)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{churnRiskBadge(c.churn_risk)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={c.churned ? 'danger' : 'success'}>
                          {c.churned ? 'Churned' : 'Active'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/customers/${c._id}`)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                            title="View"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteId(c._id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-100">
              <Pagination
                page={pagination.page ?? 1}
                totalPages={pagination.totalPages ?? 1}
                onPage={(p) => setPage(p)}
              />
            </div>
          </>
        )}
      </Card>

      {/* Create modal */}
      <CreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['customers'] })
          setShowCreate(false)
        }}
      />

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Customer" size="sm">
        <p className="text-sm text-gray-600 mb-6">
          This action cannot be undone. The customer record will be permanently removed.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button
            variant="danger"
            disabled={deleteMut.isPending}
            onClick={() => deleteMut.mutate(deleteId)}
          >
            {deleteMut.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function CreateModal({ open, onClose, onSuccess }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const mutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => { reset(); onSuccess() },
  })

  const onSubmit = (data) => {
    const payload = {
      ...data,
      age: Number(data.age),
      total_purchases: Number(data.total_purchases || 0),
      lifetime_value: Number(data.lifetime_value || 0),
      average_order_value: Number(data.average_order_value || 0),
      login_frequency: Number(data.login_frequency || 0),
    }
    mutation.mutate(payload)
  }

  return (
    <Modal open={open} onClose={onClose} title="New Customer" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {mutation.error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{mutation.error.message}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            placeholder="John"
            error={errors.first_name?.message}
            {...register('first_name', { required: 'Required' })}
          />
          <Input
            label="Last Name"
            placeholder="Doe"
            error={errors.last_name?.message}
            {...register('last_name', { required: 'Required' })}
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="john@example.com"
          error={errors.email?.message}
          {...register('email', { required: 'Required' })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Phone" placeholder="+1 555 0000" {...register('phone')} />
          <Input label="Age" type="number" placeholder="30" {...register('age')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Country" {...register('country', { required: 'Required' })} error={errors.country?.message}>
            <option value="">Select…</option>
            {COUNTRIES.filter(Boolean).map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Input label="City" placeholder="New York" {...register('city')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Gender" {...register('gender')}>
            <option value="">Select…</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </Select>
          <Input label="Membership Years" type="number" placeholder="2" {...register('membership_years')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Lifetime Value ($)" type="number" placeholder="1500" {...register('lifetime_value')} />
          <Input label="Total Purchases" type="number" placeholder="12" {...register('total_purchases')} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating…' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
