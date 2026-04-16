import client from './client'

export const getKpis = () =>
  client.get('/analytics/kpis').then((r) => r.data)

export const getByCountry = (limit = 15) =>
  client.get('/analytics/by-country', { params: { limit } }).then((r) => r.data)

export const getRevenueByQuarter = () =>
  client.get('/analytics/revenue-by-quarter').then((r) => r.data)

export const getChurnOverview = () =>
  client.get('/analytics/churn-overview').then((r) => r.data)

export const getEngagementDistribution = () =>
  client.get('/analytics/engagement-distribution').then((r) => r.data)

export const getGenderBreakdown = () =>
  client.get('/analytics/gender-breakdown').then((r) => r.data)
