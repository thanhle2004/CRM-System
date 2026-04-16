import client from './client'

export const getAtRisk = (params) =>
  client.get('/churn/at-risk', { params }).then((r) => r.data)

export const getChurnDistribution = () =>
  client.get('/churn/distribution').then((r) => r.data)

export const rescoreCustomer = (id) =>
  client.post(`/churn/score/${id}`).then((r) => r.data)

export const rescoreAll = () =>
  client.post('/churn/score-all').then((r) => r.data)
