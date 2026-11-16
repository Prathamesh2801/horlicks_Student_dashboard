import { config } from '../../config/config'
import { request } from './client'
import * as mock from './mock'

const real = {
  listUsers: () => request('/users'),
  createUser: (body) => request('/users', { method: 'POST', body }),
  updateUser: (id, body) => request(`/users/${id}`, { method: 'PATCH', body }),
}

export const { listUsers, createUser, updateUser } = config.useMock ? mock : real
