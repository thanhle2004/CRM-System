import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, Eye, Tag, Users } from 'lucide-react'
import { getDefinitions, getTriggerPreviews, runAutomation } from '../api/marketing'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { PageLoader } from '../components/ui/Spinner'
import { fmtNumber } from '../lib/utils'

const ACTION_COLORS = {
  DISCOUNT_OFFER:     'success',
  REENGAGEMENT_EMAIL: 'info',
  LOYALTY_REWARD:     'indigo',
  WINBACK_CAMPAIGN:   'warning',
  REVIEW_REQUEST:     'default',
}

export default function Marketing() {
  const qc = useQueryClient()
  const [dryRun, setDryRun] = useState(true)
  const [result, setResult] = useState(null)

  const defs     = useQuery({ queryKey: ['mktDefs'],     queryFn: getDefinitions })
  const previews = useQuery({ queryKey: ['mktPreviews'], queryFn: getTriggerPreviews })

  const runMut = useMutation({
    mutationFn: () => runAutomation(dryRun),
    onSuccess: (data) => {
      setResult(data)
      if (!dryRun) qc.invalidateQueries()
    },
  })

  if (defs.isLoading) return <PageLoader />

  const definitions = defs.data?.data ?? []
  const previewMap  = {}
  ;(previews.data?.data ?? []).forEach((p) => { previewMap[p.action] = p.count })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Marketing Automation</h1>
        <p className="text-sm text-gray-500 mt-1">Configure and run automated marketing triggers</p>
      </div>

      {/* Run Automation */}
      <Card>
        <CardHeader>
          <CardTitle>Run Automation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="w-4 h-4 accent-indigo-600"
              />
              <span className="text-sm text-gray-700">Dry Run (preview only — no changes saved)</span>
            </label>
            <Button
              onClick={() => { setResult(null); runMut.mutate() }}
              disabled={runMut.isPending}
            >
              <Play size={15} />
              {runMut.isPending ? 'Running…' : dryRun ? 'Preview Run' : 'Execute Automation'}
            </Button>
          </div>

          {runMut.error && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {runMut.error.message}
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                {result.data?.dryRun ? 'Dry Run Results' : 'Automation Results'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {(result.data?.results ?? []).map((r) => (
                  <div key={r.action} className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                    <Badge variant={ACTION_COLORS[r.action] ?? 'default'} className="mb-1.5 text-[10px]">
                      {r.action.replace(/_/g, ' ')}
                    </Badge>
                    <p className="text-2xl font-bold text-gray-900">{fmtNumber(r.triggered)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">triggered</p>
                  </div>
                ))}
              </div>
              {result.data?.totalTriggered != null && (
                <p className="mt-3 text-sm text-gray-600">
                  Total triggered: <strong>{fmtNumber(result.data.totalTriggered)}</strong>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trigger Previews */}
      <Card>
        <CardHeader>
          <CardTitle>Trigger Preview — Eligible Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {previews.isLoading ? (
            <div className="text-center text-gray-400 text-sm py-8">Loading…</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(previews.data?.data ?? []).map((p) => (
                <div key={p.action} className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="p-2.5 rounded-lg bg-white border border-gray-200">
                    <Tag size={18} className="text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 truncate">{p.action.replace(/_/g, ' ')}</p>
                    <p className="text-xl font-bold text-gray-900">{fmtNumber(p.count)}</p>
                    <p className="text-xs text-gray-400">eligible customers</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trigger Definitions */}
      <Card>
        <CardHeader>
          <CardTitle>Trigger Definitions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {definitions.map((def) => (
              <div
                key={def.action}
                className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Badge variant={ACTION_COLORS[def.action] ?? 'default'} className="mt-0.5 shrink-0">
                  {def.action.replace(/_/g, ' ')}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{def.description}</p>
                  {def.criteria && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {Object.entries(def.criteria).map(([k, v]) => (
                        <span key={k} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                          {k}: {String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold text-gray-900">{fmtNumber(previewMap[def.action])}</p>
                  <p className="text-xs text-gray-400">eligible</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
