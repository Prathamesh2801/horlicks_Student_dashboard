import { config } from '../../config/config'
import { request } from './client'
import * as mock from './mock'

export const getCities = config.useMock ? mock.getCities : () => request('/cities')
