import client from './client'

export const getBehavioralSegments = () =>
  client.get('/segments/behavioral').then((r) => r.data)

export const getValueSegments = () =>
  client.get('/segments/value').then((r) => r.data)

export const getRiskSegments = () =>
  client.get('/segments/risk').then((r) => r.data)

export const getDynamicSegment = (filters, page = 1, limit = 20) =>
  client.post('/segments/dynamic', { filters, page, limit }).then((r) => r.data)
