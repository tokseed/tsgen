import React, { useState } from 'react'
import { Sparkles, Copy, Check, AlertCircle, Lightbulb, Hash, Type, List, Code2, Braces } from 'lucide-react'
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <label className="text-lg font-bold text-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Braces className="w-5 h-5 text-white" />
          </div>
          Целевая схема JSON
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            Очистить
          </button>
          <button
            onClick={handleUseExample}
            className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors px-3 py-2 rounded-lg hover:bg-amber-50"
          >
            <Lightbulb className="w-4 h-4" />
            Пример
          </button>
        </div>
      </div>

      {/* Textarea */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-300" />
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={`{\n  "name": "string",\n  "age": "number",\n  "email": "string"\n}`}
          className={`input-field min-h-[300px] resize-y rounded-2xl relative ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:border-amber-500 focus:ring-amber-500/20'}`}
        />

        {value.trim() && (
          <button
            onClick={handleCopy}
            className="absolute right-3 top-3 p-2.5 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-amber-50 hover:text-amber-600 transition-all duration-300 shadow-md"
            title="Копировать"
          >
            {copied ? (
              <Check className="w-5 h-5 text-emerald-600" />
            ) : (
              <Copy className="w-5 h-5 text-slate-500" />
            )}
          </button>
        )}
      </div>

      {/* JSON Stats */}
      {stats && (
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200/50">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Hash className="w-4 h-4" />
            {stats.keys} ключей
          </div>
          <div className="w-px h-4 bg-slate-300" />
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <List className="w-4 h-4" />
            Глубина: {stats.depth}
          </div>
          {stats.hasObjects && (
            <span className="ml-auto px-3 py-1 text-xs font-medium bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full shadow-md">
              Объекты
            </span>
          )}
          {stats.hasArrays && (
            <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-full shadow-md">
              Массивы
            </span>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 text-sm p-4 bg-gradient-to-r from-red-500/10 to-red-600/10 border-2 border-red-500/30 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0 shadow-lg">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium text-red-700">{error}</span>
        </div>
      )}

      {/* Generate Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
        <button
          onClick={() => onGenerate(false)}
          disabled={!isValid || isGenerating}
          className="btn-primary flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Генерация...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Сгенерировать код
            </>
          )}
        </button>
        <button
          onClick={() => onGenerate(true)}
          disabled={!isValid || isGenerating}
          className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-600 text-slate-900 font-bold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/50 hover:-translate-y-1 group"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              Полный пайплайн...
            </>
          ) : (
            <>
              <Code2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Код + Тесты + Валидация
            </>
          )}
        </button>
      </div>
    </div>
  )
}
