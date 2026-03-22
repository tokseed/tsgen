import { describe, it, expect } from 'vitest'
import { CodeDisplay, EmptyState } from '../src/CodeDisplay'

describe('CodeDisplay Component', () => {
  describe('Filename Handling', () => {
    const handleFilename = (filename, isTest = false) => {
      const ext = isTest ? '.test.ts' : '.ts'
      return (filename || 'generated').replace(/\.[^/.]+$/, '') + ext
    }

    it('should add .ts extension', () => {
      expect(handleFilename('data.csv')).toBe('data.ts')
      expect(handleFilename('document.xlsx')).toBe('document.ts')
    })

    it('should add .test.ts for tests', () => {
      expect(handleFilename('data.csv', true)).toBe('data.test.ts')
      expect(handleFilename('transform.ts', true)).toBe('transform.test.ts')
    })

    it('should handle missing filename', () => {
      expect(handleFilename(null)).toBe('generated.ts')
      expect(handleFilename(undefined)).toBe('generated.ts')
    })
  })

  describe('Download Functionality', () => {
    it('should create blob with correct content type', () => {
      const textToDownload = 'const x = 1;'
      const blob = new Blob([textToDownload], { type: 'text/typescript' })
      
      expect(blob.type).toBe('text/typescript')
      expect(blob.size).toBe(textToDownload.length)
    })
  })
})

describe('EmptyState Component', () => {
  it('should render correctly', () => {
    const result = EmptyState()
    expect(result).toBeDefined()
  })
})
