import { config } from '../../config/config'
import { request } from './client'
import * as mock from './mock'

const real = {
  createVisit: (body) => request('/visits', { method: 'POST', body }),
  listVisits: (params) => request('/visits', { params }),
  getVisit: (id) => request(`/visits/${id}`),
  uploadPhoto: (visitId, { file, ...fields }) => {
    const body = new FormData()
    body.append('file', file, 'photo.jpg')
    Object.entries(fields).forEach(([k, v]) => body.append(k, v))
    return request(`/visits/${visitId}/photos`, { method: 'POST', body })
  },
  deletePhoto: (visitId, photoId) => request(`/visits/${visitId}/photos/${photoId}`, { method: 'DELETE' }),
  submitVisit: (id) => request(`/visits/${id}/submit`, { method: 'POST' }),
  getStats: (params) => request('/stats', { params }),
}

export const { createVisit, listVisits, getVisit, uploadPhoto, deletePhoto, submitVisit, getStats } =
  config.useMock ? mock : real
