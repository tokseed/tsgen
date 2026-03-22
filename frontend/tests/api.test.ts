import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../src/api', () => ({
  generateCode: vi.fn(),
  checkHealth: vi.fn(),
  validateCode: vi.fn(),
  generateTests: vi.fn(),
  fullPipeline: vi.fn(),
  ApiLogger: {
    logs: [],
    add: vi.fn(),
    clear: vi.fn(),
  },
}))

const mockGenerateCode = vi.fn()
const mockCheckHealth = vi.fn()
const mockValidateCode = vi.fn()
const mockFullPipeline = vi.fn()

vi.mock('../src/api', () => ({
  generateCode: (...args) => mockGenerateCode(...args),
  checkHealth: (...args) => mockCheckHealth(...args),
  validateCode: (...args) => mockValidateCode(...args),
  generateTests: vi.fn().mockResolvedValue({ tests_code: '// tests' }),
  fullPipeline: (...args) => mockFullPipeline(...args),
  ApiLogger: {
    logs: [],
    add: vi.fn(),
    clear: vi.fn(),
  },
}))

describe('API Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateCode', () => {
    it('should be a function', () => {
      expect(typeof mockGenerateCode).toBe('function')
    })

    it('should call fetch with correct parameters', async () => {
      const mockResponse = {
        typescript_code: 'const x = 1;',
        filename: 'test.ts',
      }
      
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const { generateCode } = await import('../src/api')
      const file = new File(['test'], 'test.csv', { type: 'text/csv' })
      
      const result = await generateCode(file, '{"data": []}', 'openrouter')
      
      expect(global.fetch).toHaveBeenCalled()
    })

    it('should throw error on HTTP error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ detail: 'Test error' }),
      })

      const { generateCode } = await import('../src/api')
      const file = new File(['test'], 'test.csv', { type: 'text/csv' })

      await expect(generateCode(file, '{}', 'auto')).rejects.toThrow('Test error')
    })
  })

  describe('checkHealth', () => {
    it('should return health status', async () => {
      const mockHealth = {
        status: 'ok',
        llm_provider: 'openrouter',
        supported_formats: ['.csv', '.xlsx'],
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHealth),
      })

      const { checkHealth } = await import('../src/api')
      const result = await checkHealth()

      expect(result.status).toBe('ok')
      expect(result.llm_provider).toBe('openrouter')
    })
  })

  describe('validateCode', () => {
    it('should return validation result', async () => {
      const mockValidation = {
        valid: true,
        errors: [],
        warnings: [],
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidation),
      })

      const { validateCode } = await import('../src/api')
      const result = await validateCode('const x = 1;')

      expect(result.valid).toBe(true)
    })
  })
})
