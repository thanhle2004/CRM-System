import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Users, DollarSign, AlertTriangle, Activity } from 'lucide-react'
import { getKpis, getRevenueByQuarter, getChurnOverview, getEngagementDistribution } from '../api/analytics'
import KpiCard from '../components/ui/KpiCard'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { PageLoader } from '../components/ui/Spinner'
import { fmtCurrency, fmtPercent, fmtNumber } from '../lib/utils'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']

export default function Dashboard() {
  const kpis      = useQuery({ queryKey: ['kpis'],      queryFn: getKpis })
  const quarterly = useQuery({ queryKey: ['quarterly'], queryFn: getRevenueByQuarter })
  const churn     = useQuery({ queryKey: ['churnOverview'], queryFn: getChurnOverview })
  const engDist   = useQuery({ queryKey: ['engDist'],   queryFn: getEngagementDistribution })

  if (kpis.isLoading) return <PageLoader />
  if (kpis.error) return <ErrorMsg msg={kpis.error.message} />

  const k = kpis.data?.data ?? {}

  const churnPie = churn.data?.data
    ? [
        { name: 'Active',  value: churn.data.data.activeCount  },
        { name: 'At Risk', value: churn.data.data.atRiskCount  },
        { name: 'Churned', value: churn.data.data.churnedCount },
      ]
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your CRM metrics</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Customers"
          value={fmtNumber(k.totalCustomers)}
          icon={Users}
          color="indigo"
        />
        <KpiCard
          title="Avg. Lifetime Value"
          value={fmtCurrency(k.avgLifetimeValue)}
          icon={DollarSign}
          color="green"
        />
        <KpiCard
          title="Churn Rate"
          value={fmtPercent(k.churnRate)}
          icon={AlertTriangle}
          color="red"
        />
        <KpiCard
          title="Avg. Engagement Score"
          value={fmtNumber(k.avgEngagementScore, 1)}
          sub="out of 100"
          icon={Activity}
          color="blue"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue by Quarter */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue by Quarter</CardTitle>
          </CardHeader>
          <CardContent>
            {quarterly.isLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={quarterly.data?.data ?? []} margin={{ top: 4, right: 16, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="quarter"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => fmtCurrency(v)} />
                  <Bar dataKey="totalRevenue" name="Revenue" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Churn Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Status</CardTitle>
          </CardHeader>
          <CardContent>
            {churn.isLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={churnPie}
                    cx="50%"
                    cy="45%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {churnPie.map((_, i) => (
                      <Cell key={i} fill={['#6366f1','#f59e0b','#ef4444'][i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Engagement distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {engDist.isLoading ? (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={engDist.data?.data ?? []} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="band" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip />
                <Bar dataKey="count" name="Customers" radius={[4,4,0,0]}>
                  {(engDist.data?.data ?? []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ErrorMsg({ msg }) {
  return (
    <div className="flex items-center justify-center py-24 text-red-500 text-sm">{msg}</div>
  )
}
