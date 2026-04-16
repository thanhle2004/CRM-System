import client from './client'

export const getDefinitions = () =>
  client.get('/marketing/definitions').then((r) => r.data)

export const getTriggerPreviews = () =>
  client.get('/marketing/triggers').then((r) => r.data)

export const runAutomation = (dryRun = true) =>
  client.post('/marketing/run-automation', { dryRun }).then((r) => r.data)

export const getByAction = (action, page = 1) =>
  client.get(`/marketing/by-action/${action}`, { params: { page } }).then((r) => r.data)
