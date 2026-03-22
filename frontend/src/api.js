const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

class ApiLogger {
  static logs = []

  static add(type, message) {
    const entry = {
      type,
      message,
      time: new Date().toLocaleTimeString()
    }
    this.logs.push(entry)
    console.log(`[API ${type.toUpperCase()}] ${message}`)
    return entry
  }

  static clear() {
    this.logs = []
  }
}

export const generateCode = async (file, targetJson, provider = 'auto') => {
  ApiLogger.add('info', `Sending request: POST ${API_URL}/generate`)
  ApiLogger.add('info', `File: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
  ApiLogger.add('info', `Target JSON length: ${targetJson.length} chars`)
  ApiLogger.add('info', `LLM Provider: ${provider}`)

  const formData = new FormData()
  formData.append('file', file)
  formData.append('target_json', targetJson)
  formData.append('llm_provider', provider)

  const startTime = Date.now()

  try {
    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      body: formData,
    })

    const duration = Date.now() - startTime
    ApiLogger.add('info', `Response received in ${duration}ms`)

    if (!response.ok) {
      const error = await response.json()
      ApiLogger.add('error', `HTTP ${response.status}: ${error.detail}`)
      throw new Error(error.detail || 'Ошибка генерации')
    }

    const data = await response.json()
    ApiLogger.add('success', `Code generated: ${data.typescript_code.length} chars`)
    ApiLogger.add('success', `Output file: ${data.filename}`)

    return data
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      ApiLogger.add('error', 'Network error: Failed to connect to API')
      throw new Error('Не удалось подключиться к API. Убедитесь, что сервер запущен.')
    }
    throw err
  }
}

export const validateCode = async (typescriptCode) => {
  const formData = new FormData()
  formData.append('typescript_code', typescriptCode)

  const response = await fetch(`${API_URL}/validate`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Ошибка валидации')
  }

  return await response.json()
}

export const generateTests = async (typescriptCode, targetJson, filename) => {
  const formData = new FormData()
  formData.append('typescript_code', typescriptCode)
  formData.append('target_json', targetJson)
  formData.append('filename', filename)

  const response = await fetch(`${API_URL}/generate-tests`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Ошибка генерации тестов')
  }

  return await response.json()
}

export const fullPipeline = async (file, targetJson, provider = 'auto') => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('target_json', targetJson)
  formData.append('llm_provider', provider)

  const startTime = Date.now()

  try {
    const response = await fetch(`${API_URL}/full-pipeline`, {
      method: 'POST',
      body: formData,
    })

    const duration = Date.now() - startTime
    ApiLogger.add('info', `Full pipeline completed in ${duration}ms`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Ошибка пайплайна')
    }

    const data = await response.json()
    ApiLogger.add('success', `Full pipeline: code + tests + validation`)

    return data
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Не удалось подключиться к API')
    }
    throw err
  }
}

export const checkHealth = async () => {
  ApiLogger.add('info', `Health check: GET ${API_URL}/health`)

  try {
    const response = await fetch(`${API_URL}/health`)
    const data = await response.json()
    ApiLogger.add('success', `Health: ${JSON.stringify(data)}`)
    return data
  } catch (err) {
    ApiLogger.add('error', `Health check failed: ${err.message}`)
    throw err
  }
}

export const getTokenStats = async () => {
  try {
    const response = await fetch(`${API_URL}/token-stats`)
    const data = await response.json()
    return data
  } catch (err) {
    console.log('Token stats not available')
    return null
  }
}

export const executeCode = async (typescriptCode, timeout = 5) => {
  const formData = new FormData()
  formData.append('typescript_code', typescriptCode)
  formData.append('timeout', timeout.toString())

  const response = await fetch(`${API_URL}/execute-only`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Ошибка выполнения кода')
  }

  return await response.json()
}

export const runTests = async (typescriptCode, testCode, timeout = 10) => {
  const formData = new FormData()
  formData.append('typescript_code', typescriptCode)
  formData.append('test_code', testCode)
  formData.append('timeout', timeout.toString())

  const response = await fetch(`${API_URL}/run-tests`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Ошибка запуска тестов')
  }

  return await response.json()
}

export const checkExecutor = async () => {
  try {
    const response = await fetch(`${API_URL}/executor/check`)
    const data = await response.json()
    return data
  } catch (err) {
    console.log('Executor check failed')
    return null
  }
}

export const fixCode = async (file, targetJson, currentCode, errors, testErrors = '', provider = 'auto') => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('target_json', targetJson)
  formData.append('current_code', currentCode)
  formData.append('errors', errors)
  formData.append('test_errors', testErrors)
  formData.append('llm_provider', provider)

  try {
    const response = await fetch(`${API_URL}/fix`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Ошибка исправления')
    }

    return await response.json()
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Не удалось подключиться к API')
    }
    throw err
  }
}

export const fixCodeDirect = async (typescriptCode, targetJson, errors = '', testErrors = '') => {
  const formData = new FormData()
  formData.append('typescript_code', typescriptCode)
  formData.append('target_json', targetJson)
  formData.append('errors', errors)
  formData.append('test_errors', testErrors)

  try {
    const response = await fetch(`${API_URL}/fix-direct`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Ошибка исправления')
    }

    return await response.json()
  } catch (err) {
    throw err
  }
}

export { ApiLogger }
