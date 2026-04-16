import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  getByCountry, getRevenueByQuarter, getEngagementDistribution, getGenderBreakdown
} from '../api/analytics'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { PageLoader } from '../components/ui/Spinner'
import { fmtCurrency, fmtNumber } from '../lib/utils'

const COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#06b6d4']

export default function Analytics() {
  const country  = useQuery({ queryKey: ['byCountry'],  queryFn: () => getByCountry(15) })
  const quarterly = useQuery({ queryKey: ['quarterly'], queryFn: getRevenueByQuarter })
  const engDist  = useQuery({ queryKey: ['engDist'],    queryFn: getEngagementDistribution })
  const gender   = useQuery({ queryKey: ['gender'],     queryFn: getGenderBreakdown })

  const loading = country.isLoading && quarterly.isLoading

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Deep-dive into your customer data</p>
      </div>

      {/* Revenue by Country */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Country (Top 15)</CardTitle>
        </CardHeader>
        <CardContent>
          {country.isLoading ? <Placeholder /> : (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={country.data?.data ?? []}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 100, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                />
                <YAxis dataKey="country" type="category" tick={{ fontSize: 12, fill: '#374151' }} width={96} />
                <Tooltip formatter={(v, n) => [n === 'totalRevenue' ? fmtCurrency(v) : fmtNumber(v), n === 'totalRevenue' ? 'Revenue' : 'Customers']} />
                <Legend />
                <Bar dataKey="totalRevenue" name="Revenue" fill="#6366f1" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Revenue by Quarter */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Signup Quarter</CardTitle>
        </CardHeader>
        <CardContent>
          {quarterly.isLoading ? <Placeholder /> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={quarterly.data?.data ?? []} margin={{ top: 4, right: 24, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="quarter"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  interval={1}
                />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmtCurrency(v)} />
                <Line
                  type="monotone"
                  dataKey="totalRevenue"
                  name="Revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Engagement Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {engDist.isLoading ? <Placeholder h={220} /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={engDist.data?.data ?? []} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="band" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
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

        {/* Gender breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Gender Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {gender.isLoading ? <Placeholder h={220} /> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={gender.data?.data ?? []}
                    cx="50%"
                    cy="45%"
                    outerRadius={80}
                    dataKey="count"
                    nameKey="gender"
                    label={({ gender: g, percent }) => `${g} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {(gender.data?.data ?? []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmtNumber(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Placeholder({ h = 280 }) {
  return (
    <div className={`flex items-center justify-center text-gray-400 text-sm`} style={{ height: h }}>
      Loading…
    </div>
  )
}
