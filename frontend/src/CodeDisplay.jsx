import React, { useState, useEffect } from 'react'
import { Copy, Check, Download, Code2, Sparkles, CopyPlus, RefreshCw, TestTube, ShieldCheck, ShieldAlert, FileCheck, Zap, FileCode } from 'lucide-react'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import 'prismjs/themes/prism-tomorrow.css'

export function CodeDisplay({ code, filename, onGenerateTests, onValidate, validation, onCopy, copied }) {
  const [downloaded, setDownloaded] = useState(false)
  const [activeTab, setActiveTab] = useState('code')
  const [testsCode, setTestsCode] = useState(null)
  const [isGeneratingTests, setIsGeneratingTests] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    Prism.highlightAll()
  }, [code, testsCode, activeTab])

  const handleCopy = () => {
    const textToCopy = activeTab === 'tests' && testsCode ? testsCode : code
    navigator.clipboard.writeText(textToCopy)
    if (onCopy) onCopy()
  }

  const handleDownload = () => {
    const textToDownload = activeTab === 'tests' && testsCode ? testsCode : code
    const ext = activeTab === 'tests' ? '.test.ts' : '.ts'
    const downloadFilename = (filename || 'generated').replace(/\.[^/.]+$/, '') + ext

    const blob = new Blob([textToDownload], { type: 'text/typescript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadFilename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2000)
  }

  const handleGenerateTests = async () => {
    if (!onGenerateTests) return
    setIsGeneratingTests(true)
    try {
      const tests = await onGenerateTests()
      setTestsCode(tests)
      setActiveTab('tests')
    } catch (err) {
      console.error('Failed to generate tests:', err)
    } finally {
      setIsGeneratingTests(false)
    }
  }

  const handleValidate = async () => {
    if (!onValidate) return
    setIsValidating(true)
    try {
      await onValidate()
    } catch (err) {
      console.error('Validation failed:', err)
    } finally {
      setIsValidating(false)
    }
  }

  if (!code) return null

  const displayCode = activeTab === 'tests' && testsCode ? testsCode : code
  const displayTitle = activeTab === 'tests' ? 'Unit Tests (Vitest/Jest)' : 'Сгенерированный TypeScript код'

  return (
    <div className="fade-in">
      {/* Tabs */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button
          onClick={() => setActiveTab('code')}
          className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 ${
            activeTab === 'code'
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 scale-105'
              : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
          }`}
        >
          <Code2 className="w-4 h-4" />
          Код
        </button>
        <button
          onClick={handleGenerateTests}
          disabled={isGeneratingTests}
          className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 ${
            activeTab === 'tests'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 shadow-lg shadow-amber-500/30 scale-105'
              : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
          } ${isGeneratingTests ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isGeneratingTests ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <CopyPlus className="w-4 h-4" />
          )}
          {isGeneratingTests ? 'Генерация...' : 'Тесты'}
        </button>
        <button
          onClick={handleValidate}
          disabled={isValidating}
          className={`px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 ${
            validation
              ? validation.valid
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 scale-105'
                : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30'
              : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
          } ${isValidating ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isValidating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : validation ? (
            validation.valid ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <ShieldAlert className="w-4 h-4" />
            )
          ) : (
            <FileCheck className="w-4 h-4" />
          )}
          {isValidating ? 'Проверка...' : validation ? (validation.valid ? '✓ Валидно' : '✕ Ошибки') : 'Валидация'}
        </button>
      </div>

      {/* Validation Result */}
      {validation && (
        <div className={`mb-6 p-6 rounded-2xl border-2 backdrop-blur-sm fade-in ${
          validation.valid
            ? 'bg-green-500/20 border-green-500/50'
            : 'bg-red-500/20 border-red-500/50'
        }`}>
          <div className="flex items-start gap-4">
            {validation.valid ? (
              <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center shadow-lg">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1">
              <p className={`font-bold text-lg ${validation.valid ? 'text-green-300' : 'text-red-300'}`}>
                {validation.valid ? 'Код валиден' : 'Обнаружены ошибки'}
              </p>
              {validation.errors && validation.errors.length > 0 && (
                <ul className="mt-3 text-sm text-red-200 list-disc list-inside space-y-1">
                  {validation.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
              {validation.warnings && validation.warnings.length > 0 && (
                <ul className="mt-3 text-sm text-amber-200 list-disc list-inside space-y-1">
                  {validation.warnings.slice(0, 3).map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Code Display Card */}
      <div className="card p-6 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <FileCode className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-slate-800">{displayTitle}</h3>
              <p className="text-sm text-slate-500 mt-1">TypeScript • {displayCode.length} символов</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                copied
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 scale-105'
                  : 'bg-slate-100 hover:bg-gradient-to-r hover:from-slate-200 hover:to-slate-300 text-slate-700'
              }`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Скопировано!' : 'Копия'}
            </button>
            <button
              onClick={handleDownload}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                downloaded
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 scale-105'
                  : 'bg-slate-100 hover:bg-gradient-to-r hover:from-slate-200 hover:to-slate-300 text-slate-700'
              }`}
            >
              {downloaded ? <Check className="w-5 h-5" /> : <Download className="w-5 h-5" />}
              {downloaded ? 'Скачано!' : 'Скачать'}
            </button>
          </div>
        </div>

        {/* Code Block */}
        <div className="code-block rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="flex items-center gap-3 px-5 py-4 bg-slate-800/90 border-b border-slate-700">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors" />
              <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors" />
              <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors" />
            </div>
            <span className="ml-3 text-xs text-slate-400 font-mono">
              {filename ? filename.replace(/\.[^/.]+$/, '') + (activeTab === 'tests' ? '.test.ts' : '.ts') : 'generated.ts'}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-slate-500">Syntax Highlighted</span>
            </div>
          </div>
          <pre className="p-0 overflow-auto max-h-[500px]">
            <code className="language-typescript block p-6 !bg-[#1e1e1e] !text-sm !leading-relaxed">
              {displayCode}
            </code>
          </pre>
        </div>
      </div>
    </div>
  )
}

export function EmptyState() {
  return (
    <div className="card-glass p-16 flex flex-col items-center text-center fade-in">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative p-8 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
          <Sparkles className="w-20 h-20 text-white" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">Готов к генерации</h3>
      <p className="text-lg text-white/80 max-w-md leading-relaxed">
        Загрузите файл с данными и укажите желаемую структуру JSON. 
        GigaChat AI создаст оптимальный TypeScript код.
      </p>
      <div className="mt-8 flex items-center gap-3 text-sm text-white/60">
        <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
        Ожидание входных данных
      </div>
      
      {/* Quick tips */}
      <div className="mt-10 grid grid-cols-3 gap-4 w-full max-w-lg">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
          <FileCode className="w-6 h-6 text-emerald-300 mx-auto mb-2" />
          <p className="text-xs text-white/70">Загрузите файл</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
          <Code2 className="w-6 h-6 text-amber-300 mx-auto mb-2" />
          <p className="text-xs text-white/70">Опишите схему</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
          <Zap className="w-6 h-6 text-purple-300 mx-auto mb-2" />
          <p className="text-xs text-white/70">Получите код</p>
        </div>
      </div>
    </div>
  )
}
