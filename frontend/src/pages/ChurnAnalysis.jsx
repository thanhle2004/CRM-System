import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { getAtRisk, getChurnDistribution, rescoreAll } from '../api/churn'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge, { churnRiskBadge } from '../components/ui/Badge'
import Pagination from '../components/ui/Pagination'
import { PageLoader } from '../components/ui/Spinner'
import { fmtNumber, fmtPercent } from '../lib/utils'

const RISK_COLORS = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444' }

export default function ChurnAnalysis() {
  const qc          = useQueryClient()
  const [page, setPage] = useState(1)
  const [risk, setRisk] = useState('')

  const dist   = useQuery({ queryKey: ['churnDist'],  queryFn: getChurnDistribution })
  const atRisk = useQuery({
    queryKey: ['atRisk', page, risk],
    queryFn: () => getAtRisk({ page, limit: 20, ...(risk && { risk }) }),
    keepPreviousData: true,
  })

  const rescoreMut = useMutation({
    mutationFn: rescoreAll,
    onSuccess: () => qc.invalidateQueries(),
  })

  const customers  = atRisk.data?.data ?? []
  const pagination = atRisk.data?.pagination ?? {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Churn Analysis</h1>
          <p className="text-sm text-gray-500 mt-1">Identify and act on at-risk customers</p>
        </div>
        <Button
          variant="secondary"
          disabled={rescoreMut.isPending}
          onClick={() => rescoreMut.mutate()}
        >
          <RefreshCw size={15} />
          {rescoreMut.isPending ? 'Rescoring…' : 'Rescore All'}
        </Button>
      </div>

      {rescoreMut.isSuccess && (
        <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">
          All churn scores have been recomputed successfully.
        </div>
      )}

      {/* Distribution cards + chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk band cards */}
        <div className="space-y-3">
          {dist.isLoading ? (
            <Card className="p-8 flex items-center justify-center">
              <span className="text-gray-400 text-sm">Loading…</span>
            </Card>
          ) : (
            (dist.data?.data ?? []).map((band) => (
              <Card key={band.risk} className="p-4 flex items-center gap-4">
                <div
                  className="w-1 self-stretch rounded-full"
                  style={{ background: RISK_COLORS[band.risk] ?? '#6b7280' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} style={{ color: RISK_COLORS[band.risk] }} />
                    <span className="font-semibold text-sm text-gray-700">{band.risk} Risk</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">{fmtNumber(band.count)}</p>
                  <p className="text-xs text-gray-400">Avg score: {fmtNumber(band.avgScore, 1)}</p>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Churn Risk Distribution</CardTitle></CardHeader>
          <CardContent>
            {dist.isLoading ? (
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={dist.data?.data ?? []} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="risk" tick={{ fontSize: 13, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Customers" radius={[6,6,0,0]}>
                    {(dist.data?.data ?? []).map((d) => (
                      <Cell key={d.risk} fill={RISK_COLORS[d.risk] ?? '#6b7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* At-risk table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">At-Risk Customers</h3>
          <select
            value={risk}
            onChange={(e) => { setRisk(e.target.value); setPage(1) }}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Risk Levels</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Name','Email','Country','Churn Score','Risk','Days Inactive','Actions Taken'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No customers found
                  </td>
                </tr>
              ) : customers.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{c.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email}</td>
                  <td className="px-4 py-3 text-gray-500">{c.country}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(c.churn_score, 100)}%`,
                            background: RISK_COLORS[c.churn_risk] ?? '#6b7280',
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{fmtNumber(c.churn_score)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{churnRiskBadge(c.churn_risk)}</td>
                  <td className="px-4 py-3 text-gray-600">{fmtNumber(c.days_since_last_purchase)} days</td>
                  <td className="px-4 py-3 text-gray-500">{c.marketing_actions?.length ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100">
          <Pagination
            page={pagination.page ?? 1}
            totalPages={pagination.totalPages ?? 1}
            onPage={setPage}
          />
        </div>
      </Card>
    </div>
  )
}
