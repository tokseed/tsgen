const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

class ApiLogger {
  static logs = []

  static add(type, message) {
    const entry = { type, message, time: new Date().toLocaleTimeString() }
    this.logs.push(entry)
    console.log(`[API] ${type}: ${message}`)
    return entry
  }

  static clear() {
    this.logs = []
  }
}

const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`
  console.log(`[API] ${options.method || 'GET'} ${url}`)
  
  const response = await fetch(url, {
    ...options,
  })
  
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.detail || errorMessage
    } catch {}
    throw new Error(errorMessage)
  }
  
  return response.json()
}

export const generateCode = async (file, targetJson, provider = 'auto') => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('target_json', targetJson)
  formData.append('llm_provider', provider)

  const startTime = Date.now()
  const data = await apiFetch('/generate', {
    method: 'POST',
    body: formData,
  })

  ApiLogger.add('success', `Generated in ${Date.now() - startTime}ms`)
  return data
}

export const validateCode = async (typescriptCode, targetJson = null) => {
  const formData = new FormData()
  formData.append('typescript_code', typescriptCode)
  if (targetJson) formData.append('target_json', targetJson)

  return apiFetch('/validate', {
    method: 'POST',
    body: formData,
  })
}

export const generateTests = async (typescriptCode, targetJson, filename) => {
  const formData = new FormData()
  formData.append('typescript_code', typescriptCode)
  formData.append('target_json', targetJson)
  formData.append('filename', filename)

  return apiFetch('/generate-tests', {
    method: 'POST',
    body: formData,
  })
}

export const fullPipeline = async (file, targetJson, provider = 'auto') => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('target_json', targetJson)
  formData.append('llm_provider', provider)

  return apiFetch('/full-pipeline', {
    method: 'POST',
    body: formData,
  })
}

export const checkHealth = async () => {
  return apiFetch('/health')
}

export const getTokenStats = async () => {
  try {
    return await apiFetch('/token-stats')
  } catch (err) {
    console.log('[TokenStats] Not available:', err.message)
    return null
  }
}

export const executeCode = async (typescriptCode, timeout = 5) => {
  const formData = new FormData()
  formData.append('typescript_code', typescriptCode)
  formData.append('timeout', timeout.toString())

  return apiFetch('/execute-only', {
    method: 'POST',
    body: formData,
  })
}

export const runTests = async (typescriptCode, testCode, timeout = 10) => {
  const formData = new FormData()
  formData.append('typescript_code', typescriptCode)
  formData.append('test_code', testCode)
  formData.append('timeout', timeout.toString())

  return apiFetch('/run-tests', {
    method: 'POST',
    body: formData,
  })
}

export const checkExecutor = async () => {
  try {
    return await apiFetch('/executor/check')
  } catch {
    return null
  }
}

export const fixCodeDirect = async (typescriptCode, targetJson, errors = '', testErrors = '') => {
  const formData = new FormData()
  formData.append('typescript_code', typescriptCode)
  formData.append('target_json', targetJson)
  formData.append('errors', errors)
  formData.append('test_errors', testErrors)

  return apiFetch('/fix-direct', {
    method: 'POST',
    body: formData,
  })
}

export { ApiLogger }
