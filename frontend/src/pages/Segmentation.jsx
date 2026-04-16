import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getBehavioralSegments, getValueSegments, getRiskSegments } from '../api/segments'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { PageLoader } from '../components/ui/Spinner'
import { fmtNumber, fmtPercent } from '../lib/utils'

const BEHAVIORAL_COLORS = ['#6366f1','#22c55e','#f59e0b','#94a3b8']
const VALUE_COLORS      = ['#6366f1','#3b82f6','#93c5fd']
const RISK_COLORS       = ['#22c55e','#f59e0b','#94a3b8','#ef4444']

export default function Segmentation() {
  const behavioral = useQuery({ queryKey: ['behavioral'], queryFn: getBehavioralSegments })
  const value      = useQuery({ queryKey: ['value'],      queryFn: getValueSegments })
  const risk       = useQuery({ queryKey: ['risk'],       queryFn: getRiskSegments })

  if (behavioral.isLoading && value.isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Segmentation</h1>
        <p className="text-sm text-gray-500 mt-1">Understand your customer segments</p>
      </div>

      {/* Behavioral Segments */}
      <Section
        title="Behavioral Segments"
        description="Based on login frequency and session duration"
        data={behavioral.data?.data}
        loading={behavioral.isLoading}
        nameKey="segment"
        colors={BEHAVIORAL_COLORS}
        chartType="bar"
      />

      {/* Value Segments */}
      <Section
        title="Value Segments"
        description="Based on lifetime value (High ≥$5k, Mid $1k–$5k, Low <$1k)"
        data={value.data?.data}
        loading={value.isLoading}
        nameKey="segment"
        colors={VALUE_COLORS}
        chartType="pie"
      />

      {/* Risk Segments */}
      <Section
        title="Risk Segments"
        description="Based on churn score bands"
        data={risk.data?.data}
        loading={risk.isLoading}
        nameKey="segment"
        colors={RISK_COLORS}
        chartType="bar"
      />
    </div>
  )
}

function Section({ title, description, data, loading, nameKey, colors, chartType }) {
  const items = data ?? []
  const total = items.reduce((s, d) => s + (d.count ?? 0), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stat cards */}
            <div className="lg:col-span-1 grid grid-cols-2 gap-3 content-start">
              {items.map((item, i) => (
                <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: colors[i % colors.length] }}
                    />
                    <span className="text-xs text-gray-500 truncate">{item[nameKey]}</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{fmtNumber(item.count)}</p>
                  <p className="text-xs text-gray-400">{fmtPercent(total ? (item.count / total) * 100 : 0)}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={200}>
                {chartType === 'pie' ? (
                  <PieChart>
                    <Pie
                      data={items}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      nameKey={nameKey}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {items.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtNumber(v)} />
                  </PieChart>
                ) : (
                  <BarChart data={items} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey={nameKey} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Customers" radius={[4,4,0,0]}>
                      {items.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
