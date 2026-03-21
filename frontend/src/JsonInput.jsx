import React, { useState } from 'react'
import { Sparkles, Copy, Check, AlertCircle, Lightbulb, Hash, Type, List } from 'lucide-react'
import EXAMPLE_JSON from './example'

export default function JsonInput({ value, onChange, onGenerate, isGenerating }) {
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const validateJson = (text) => {
    if (!text.trim()) {
      setError(null)
      return true
    }
    try {
      JSON.parse(text)
      setError(null)
      return true
    } catch (e) {
      setError(e.message)
      return false
    }
  }

  const handleChange = (e) => {
    const newValue = e.target.value
    onChange(newValue)
    if (newValue.trim()) {
      validateJson(newValue)
    } else {
      setError(null)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleUseExample = () => {
    onChange(EXAMPLE_JSON)
    setError(null)
  }

  const handleClear = () => {
    onChange('')
    setError(null)
  }

  const isValid = value.trim() && !error

  const getJsonStats = () => {
    if (!value.trim()) return null
    try {
      const parsed = JSON.parse(value)
      const keys = Object.keys(parsed)
      const depth = (obj, d = 0) => typeof obj === 'object' && obj !== null
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

  const stats = getJsonStats()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Type className="w-5 h-5 text-sber-green" />
          Пример целевого JSON
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Очистить
          </button>
          <button
            onClick={handleUseExample}
            className="flex items-center gap-2 text-sm text-sber-green hover:text-sber-dark transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            Использовать пример
          </button>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={`{\n  "data": [],\n  "metadata": {}\n}`}
          className={`input-field min-h-[280px] resize-y ${error ? 'border-red-500' : ''}`}
        />

        {value.trim() && (
          <button
            onClick={handleCopy}
            className="absolute right-3 top-3 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {copied ? (
              <Check className="w-5 h-5 text-sber-green" />
            ) : (
              <Copy className="w-5 h-5 text-slate-500" />
            )}
          </button>
        )}
      </div>

      {/* JSON Stats */}
      {stats && (
        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Hash className="w-3 h-3" />
            {stats.keys} ключей
          </div>
          <div className="flex items-center gap-1">
            <List className="w-3 h-3" />
            Глубина: {stats.depth}
          </div>
          {stats.hasObjects && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded">Объекты</span>
          )}
          {stats.hasArrays && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded">Массивы</span>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500 p-3 bg-red-50 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Generate Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onGenerate(false)}
          disabled={!isValid || isGenerating}
          className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 spinner border-2 border-white border-t-transparent rounded-full" />
              Генерация...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Код
            </>
          )}
        </button>
        <button
          onClick={() => onGenerate(true)}
          disabled={!isValid || isGenerating}
          className="bg-gradient-to-r from-accent-yellow to-accent-yellow/80 hover:from-accent-yellow/90 hover:to-accent-yellow text-slate-900 font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-accent-yellow/30"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 spinner border-2 border-slate-900 border-t-transparent rounded-full" />
              Полный пайплайн...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Код + Тесты + Валидация
            </>
          )}
        </button>
      </div>
    </div>
  )
}
