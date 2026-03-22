import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('JsonInput Validation', () => {
  describe('JSON Validation', () => {
    const validateJson = (text) => {
      if (!text.trim()) return { valid: true, error: null }
      try {
        JSON.parse(text)
        return { valid: true, error: null }
      } catch (e) {
        return { valid: false, error: e.message }
      }
    }

    it('should validate correct JSON', () => {
      expect(validateJson('{"name": "test"}').valid).toBe(true)
      expect(validateJson('[1, 2, 3]').valid).toBe(true)
      expect(validateJson('{"data": [], "meta": {}}').valid).toBe(true)
    })

    it('should reject invalid JSON', () => {
      expect(validateJson('{name: "test"}').valid).toBe(false)
      expect(validateJson('{"incomplete": ').valid).toBe(false)
      expect(validateJson('not json at all').valid).toBe(false)
    })

    it('should handle empty input', () => {
      expect(validateJson('').valid).toBe(true)
      expect(validateJson('   ').valid).toBe(true)
    })
  })

  describe('JSON Statistics', () => {
    const getJsonStats = (value) => {
      if (!value.trim()) return null
      try {
        const parsed = JSON.parse(value)
        const keys = Object.keys(parsed)
        const depth = (obj, d = 0) =>
          typeof obj === 'object' && obj !== null
            ? Math.max(...Object.values(obj).map(v => depth(v, d + 1)), d)
            : d
        return {
          keys: keys.length,
          depth: depth(parsed),
          hasArrays: JSON.stringify(parsed).includes('['),
          hasObjects: JSON.stringify(parsed).includes('{'),
        }
      } catch {
        return null
      }
    }

    it('should extract JSON stats correctly', () => {
      const result = getJsonStats('{"name": "test", "age": 25}')
      expect(result.keys).toBe(2)
      expect(result.depth).toBe(0)
      expect(result.hasObjects).toBe(true)
      expect(result.hasArrays).toBe(false)
    })

    it('should detect nested objects', () => {
      const result = getJsonStats('{"user": {"profile": {"name": "test"}}}')
      expect(result.depth).toBe(2)
    })

    it('should detect arrays', () => {
      const result = getJsonStats('{"items": [1, 2, 3]}')
      expect(result.hasArrays).toBe(true)
    })

    it('should handle invalid JSON', () => {
      expect(getJsonStats('invalid')).toBe(null)
    })
  })
})
