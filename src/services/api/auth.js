import { config } from '../../config/config'
import { request } from './client'
import * as mock from './mock'

export const login = config.useMock ? mock.login : (body) => request('/auth/login', { method: 'POST', body })
