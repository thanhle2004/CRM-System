import client from './client'

export const getCustomers = (params) =>
  client.get('/customers', { params }).then((r) => r.data)

export const getCustomer = (id) =>
  client.get(`/customers/${id}`).then((r) => r.data)

export const createCustomer = (data) =>
  client.post('/customers', data).then((r) => r.data)

export const updateCustomer = (id, data) =>
  client.patch(`/customers/${id}`, data).then((r) => r.data)

export const deleteCustomer = (id) =>
  client.delete(`/customers/${id}`).then((r) => r.data)

export const recomputeScores = () =>
  client.post('/customers/recompute-scores').then((r) => r.data)
